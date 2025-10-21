from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os
import subprocess
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import sys

app = FastAPI(title="ODIONS AI Microservice")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "."
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# CSV file paths
clients_file = os.path.join(DATA_DIR, "clients.csv")
orders_file = os.path.join(DATA_DIR, "orders.csv")
messages_file = os.path.join(DATA_DIR, "messages.csv")

# Load datasets or initialize empty DataFrames with expected columns
clients_df = (
    pd.read_csv(clients_file)
    if os.path.exists(clients_file)
    else pd.DataFrame(columns=["client_id", "name", "city", "tenant_id"])
)
orders_df = (
    pd.read_csv(orders_file)
    if os.path.exists(orders_file)
    else pd.DataFrame(
        columns=[
            "id",
            "client_id",
            "tenant_id",
            "date_commande",
            "montant_total",
            "statut_commande",
            "delivery_company_id",
        ]
    )
)
messages_df = (
    pd.read_csv(messages_file)
    if os.path.exists(messages_file)
    else pd.DataFrame(
        columns=["id", "client_id", "tenant_id", "content", "created_at"]
    )
)

analyzer = SentimentIntensityAnalyzer()

# ---------------- Helper Functions ----------------
def build_client_features(tenant_id: int = 1) -> pd.DataFrame:
    od = orders_df[orders_df["tenant_id"] == tenant_id].copy()
    if od.empty:
        return pd.DataFrame()
    od["date_commande"] = pd.to_datetime(od["date_commande"], errors="coerce")
    grouped = od.groupby("client_id").agg(
        total_spent=("montant_total", "sum"),
        order_count=("id", "count"),
        avg_order=("montant_total", "mean"),
        last_order_date=("date_commande", "max"),
    ).reset_index()
    grouped["days_since_last"] = (pd.Timestamp.now() - grouped["last_order_date"]).dt.days
    grouped = grouped.fillna(0)
    return grouped


# ---------------- Request Models ----------------
class SegmentationRequest(BaseModel):
    tenant_id: Optional[int] = 1
    n_clusters: Optional[int] = 3
    criteres: Optional[Dict[str, Any]] = None


class PredictionRequest(BaseModel):
    tenant_id: Optional[int] = 1
    client_ids: Optional[List[int]] = None


class SentimentRequest(BaseModel):
    tenant_id: Optional[int] = 1
    messages: Optional[List[str]] = None
    client_message_pairs: Optional[List[Dict[str, Any]]] = None


# ---------------- Routes ----------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/ai/regenerate-data")
def regenerate_data():
    try:
        subprocess.run([sys.executable, "data_generator.py"], check=True)

        # reload the datasets dynamically
        global clients_df, orders_df, messages_df
        if os.path.exists(clients_file):
            clients_df = pd.read_csv(clients_file)
        if os.path.exists(orders_file):
            orders_df = pd.read_csv(orders_file)
        if os.path.exists(messages_file):
            messages_df = pd.read_csv(messages_file)

        return {"message": "✅ Les données ont été régénérées avec succès !"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Erreur lors de la régénération : {str(e)}"})


@app.post("/api/ai/segmentation")
def segmentation(req: SegmentationRequest):
    try:
        filters = req.criteres or {}

        df = orders_df[orders_df["tenant_id"] == req.tenant_id].copy()
        if df.empty:
            return {
                "segments": {},
                "insights": [],
                "summary": {"clients": 0, "clusters": req.n_clusters},
            }

        df["date_commande"] = pd.to_datetime(df["date_commande"], errors="coerce")

        # Apply filters
        if "date_from" in filters:
            df = df[df["date_commande"] >= pd.to_datetime(filters["date_from"])]
        if "date_to" in filters:
            df = df[df["date_commande"] <= pd.to_datetime(filters["date_to"])]
        if "min_spent" in filters:
            df = df[df["montant_total"] >= float(filters["min_spent"])]
        if "min_orders" in filters:
            order_counts = df["client_id"].value_counts()
            valid_clients = order_counts[order_counts >= int(filters["min_orders"])].index
            df = df[df["client_id"].isin(valid_clients)]
        if "client_type" in filters:
            ctype = filters["client_type"].lower()
            if ctype == "vip":
                df = df[df["montant_total"] > 3000]
            elif ctype == "frequent":
                counts = df["client_id"].value_counts()
                freq_clients = counts[counts > 5].index
                df = df[df["client_id"].isin(freq_clients)]
            elif ctype == "new":
                recent_threshold = pd.Timestamp.now() - pd.Timedelta(days=30)
                df = df[df["date_commande"] > recent_threshold]

        if df.empty:
            return {
                "segments": {},
                "insights": [],
                "summary": {"clients": 0, "clusters": req.n_clusters},
            }

        # Build features
        features = df.groupby("client_id").agg(
            total_spent=("montant_total", "sum"),
            order_count=("id", "count"),
            avg_order=("montant_total", "mean"),
            last_order_date=("date_commande", "max"),
        ).reset_index()
        features["days_since_last"] = (pd.Timestamp.now() - features["last_order_date"]).dt.days
        features = features.fillna(0)

        X = features[["total_spent", "order_count", "avg_order", "days_since_last"]].values
        k = max(2, int(req.n_clusters or 3))
        model = KMeans(n_clusters=k, random_state=42)
        labels = model.fit_predict(X)
        features["cluster"] = labels

        # Rank clusters by avg_spent
        cluster_summary = (
            features.groupby("cluster")
            .agg(avg_spent=("total_spent", "mean"), count=("client_id", "count"))
            .reset_index()
            .sort_values("avg_spent", ascending=False)
            .reset_index(drop=True)
        )

        role_names = ["VIP", "Frequent", "Regular", "LowValue"]
        mapping = {
            row["cluster"]: role_names[i] if i < len(role_names) else f"Cluster_{i}"
            for i, row in cluster_summary.iterrows()
        }

        segments = {}
        for cl, dfc in features.groupby("cluster"):
            segments[mapping.get(cl, str(cl))] = dfc[
                ["client_id", "total_spent", "order_count", "avg_order", "days_since_last"]
            ].to_dict(orient="records")

        insights = []
        for i, row in cluster_summary.iterrows():
            cluster_name = mapping[row["cluster"]]
            df_cluster = features[features["cluster"] == row["cluster"]]
            avg_days = int(df_cluster["days_since_last"].mean())
            avg_spent = round(row["avg_spent"], 2)

            desc = (
                f"Les {cluster_name}s dépensent en moyenne {avg_spent} DH et effectuent "
                f"{np.random.randint(1,10)} commandes par mois. Leur dernier achat remonte à {avg_days} jours."
            )

            actions_pool = [
                f"Envoyez un coupon de {np.random.randint(5, 20)}% pour booster l'engagement.",
                "Proposez des bundles de produits personnalisés.",
                "Lancez une campagne marketing ciblée sur WhatsApp.",
                f"Offrez une récompense de fidélité de {np.random.randint(50, 200)} DH.",
                "Analysez leurs produits favoris pour recommandations personnalisées.",
            ]
            np.random.shuffle(actions_pool)
            actions = actions_pool[:2]

            insights.append(
                {"cluster": cluster_name, "description": desc, "actions": actions}
            )

        return {
            "segments": segments,
            "insights": insights,
            "summary": {
                "clients": int(features.shape[0]),
                "clusters": k,
                "filters_applied": filters,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/prediction")
def prediction(req: PredictionRequest):
    try:
        features = build_client_features(req.tenant_id)
        if features.empty:
            return {"predictions": [], "summary": "No data"}

        np.random.seed(42)
        features["next_purchase"] = features["avg_order"] * np.random.uniform(
            0.8, 1.6, size=features.shape[0]
        )
        X = features[["total_spent", "order_count", "avg_order", "days_since_last"]].values
        y = features["next_purchase"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
        joblib.dump(model, os.path.join(MODELS_DIR, f"rf_pred_tenant_{req.tenant_id}.joblib"))

        to_pred = (
            features[features["client_id"].isin(req.client_ids)]
            if req.client_ids
            else features
        )
        preds = model.predict(
            to_pred[["total_spent", "order_count", "avg_order", "days_since_last"]].values
        )

        out = [
            {"client_id": int(cid), "predicted_next_purchase": float(round(p, 2))}
            for cid, p in zip(to_pred["client_id"].values, preds)
        ]
        return {"predictions": out, "summary": {"trained_on": int(X_train.shape[0])}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/sentiment")
def sentiment(req: SentimentRequest):
    try:
        results = []
        if req.messages:
            for m in req.messages:
                s = analyzer.polarity_scores(m)
                results.append({"text": m, "score": s})
        if req.client_message_pairs:
            for pair in req.client_message_pairs:
                text = pair.get("text", "")
                client_id = pair.get("client_id")
                s = analyzer.polarity_scores(text)
                results.append({"client_id": client_id, "text": text, "score": s})
        if not req.messages and not req.client_message_pairs:
            df = messages_df[messages_df["tenant_id"] == req.tenant_id] if not messages_df.empty else pd.DataFrame()
            for _, row in df.iterrows():
                s = analyzer.polarity_scores(str(row.get("content", "")))
                results.append(
                    {"client_id": int(row.get("client_id")), "text": row.get("content"), "score": s}
                )
        return {"sentiments": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/clv")
def get_clv():
    try:
        features = build_client_features(tenant_id=1)
        if features.empty:
            return {"clv": []}

        features["clv"] = features["avg_order"] * features["order_count"] * np.random.uniform(
            1.1, 1.5
        )
        clv_top = features.sort_values("clv", ascending=False).head(10)
        clv_out = [
            {"client_id": int(row.client_id), "predicted_clv": float(round(row.clv, 2))}
            for _, row in clv_top.iterrows()
        ]
        return {"clv": clv_out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/churn")
def get_churn():
    try:
        features = build_client_features(tenant_id=1)
        if features.empty:
            return {"risks": []}

        np.random.seed(42)
        features["risk_level"] = np.random.choice(
            ["Low", "Medium", "High"], size=features.shape[0]
        )
        out = [
            {"client_id": int(row.client_id), "risk_level": row.risk_level}
            for _, row in features.iterrows()
        ]
        return {"risks": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/recommendations")
def get_recommendations():
    try:
        features = build_client_features(tenant_id=1)
        if features.empty:
            return {"recommendations": []}

        products = ["Produit A", "Produit B", "Produit C", "Produit D"]
        np.random.seed(42)
        recommendations = [
            {"client_id": int(cid), "product_name": np.random.choice(products)}
            for cid in features["client_id"]
        ]
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# data_generator.py
import pandas as pd
import numpy as np
from faker import Faker

fake = Faker()
num_clients = 500
num_orders = 2000
num_messages = 1500

# Clients
clients = pd.DataFrame({
    "client_id": range(1, num_clients + 1),
    "name": [fake.name() for _ in range(num_clients)],
    "city": [fake.city() for _ in range(num_clients)],
    "tenant_id": 1
})
clients.to_csv("clients.csv", index=False)

# Orders
orders = pd.DataFrame({
    "id": range(1, num_orders + 1),
    "client_id": np.random.choice(clients["client_id"], num_orders),
    "tenant_id": 1,
    "date_commande": [fake.date_this_year() for _ in range(num_orders)],
    "montant_total": np.round(np.random.uniform(50, 500, num_orders), 2),
    "statut_commande": np.random.choice(["completed","cancelled"], num_orders),
    "delivery_company_id": np.random.choice([1,2,3], num_orders)
})
orders.to_csv("orders.csv", index=False)

# Messages
messages = pd.DataFrame({
    "id": range(1, num_messages + 1),
    "client_id": np.random.choice(clients["client_id"], num_messages),
    "tenant_id": 1,
    "content": [fake.sentence() for _ in range(num_messages)],
    "created_at": [fake.date_this_year() for _ in range(num_messages)]
})
messages.to_csv("messages.csv", index=False)

print("CSV files generated successfully!")

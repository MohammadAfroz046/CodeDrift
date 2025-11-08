import torch
import pandas as pd
import pickle
from your_module import SupplyChainHybrid   # change to actual filename

def build_model_and_data():

    SALES = "data/Sales Order.csv"
    EDGES = "data/Edges (Plant).csv"
    NODES = "data/Nodes.csv"
    SAVE = "data/supply_chain_model.pkl"

    # Initialize class (loads and preprocesses data)
    svc = SupplyChainHybrid(SALES, EDGES, NODES)

    # ✅ Load saved state if .pkl exists
    try:
        with open(SAVE, "rb") as f:
            state = pickle.load(f)
            svc.model.load_state_dict(state)
            print("✅ Model loaded from .pkl")

    except FileNotFoundError:
        print("⚠ No .pkl found — training model first...")
        svc.train(epochs=120)
        with open(SAVE, "wb") as f:
            pickle.dump(svc.model.state_dict(), f)
        print("✅ Model trained and saved")

    # return usable components for prediction
    return (
        svc.model,
        svc.node_to_idx,
        svc.scalers,
        svc.last_x,
        svc.edge_index
    )

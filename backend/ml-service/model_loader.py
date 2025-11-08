import torch
import pandas as pd
import pickle
from your_module import SupplyChainHybrid   # import your class

def build_model_and_data():

    SALES = "data/Sales Order.csv"
    EDGES = "data/Edges (Plant).csv"
    NODES = "data/Nodes.csv"

    svc = SupplyChainHybrid(SALES, EDGES, NODES)

    return (
        svc.model,
        svc.node_to_idx,
        svc.scalers,
        svc.last_x,
        svc.edge_index
    )

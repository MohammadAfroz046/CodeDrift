# import torch
# import pandas as pd
# import pickle
# from your_module import SupplyChainHybrid   # import your class

# def build_model_and_data():

#     SALES = "data/Sales Order.csv"
#     EDGES = "data/Edges (Plant).csv"
#     NODES = "data/Nodes.csv"

#     svc = SupplyChainHybrid(SALES, EDGES, NODES)

#     return (
#         svc.model,
#         svc.node_to_idx,
#         svc.scalers,
#         svc.last_x,
#         svc.edge_index
#     )


import torch
import pandas as pd
import pickle
import os
import sys

# Add the path to your model definition
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from your_module import SupplyChainHybrid  # import your class
except ImportError:
    # Fallback if the module isn't available
    class SupplyChainHybrid:
        def __init__(self, sales_path, edges_path, nodes_path):
            self.sales_path = sales_path
            self.edges_path = edges_path
            self.nodes_path = nodes_path
            self.model = None
            self.node_to_idx = {}
            self.scalers = {}
            self.last_x = None
            self.edge_index = None

def build_model_and_data(sales_path=None, edges_path=None, nodes_path=None):
    """Build model and load data with flexible file paths"""
    
    # Use default paths if not provided
    if sales_path is None:
        sales_path = "datasets/Sales Order.csv"  # Updated to match your app's path
    if edges_path is None:
        edges_path = "data/Edges (Plant).csv"
    if nodes_path is None:
        nodes_path = "data/Nodes.csv"
    
    # Check if files exist
    for path in [sales_path, edges_path, nodes_path]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required file not found: {path}")
    
    svc = SupplyChainHybrid(sales_path, edges_path, nodes_path)
    
    return {
        "model": svc.model,
        "node_to_idx": svc.node_to_idx,
        "scalers": svc.scalers,
        "last_x": svc.last_x,
        "edge_index": svc.edge_index,
        "sales_path": sales_path,
        "edges_path": edges_path,
        "nodes_path": nodes_path
    }

def load_trained_model(model_path):
    """Load a pre-trained model from file"""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    return model_data

def save_model(model_data, model_path):
    """Save model data to file"""
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    return model_path
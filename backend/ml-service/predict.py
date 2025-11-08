# def make_prediction(product_name, model, node_to_idx, scalers, last_x, edge_index):

#     model.eval()
#     preds = []
#     cur = last_x.clone()

#     with torch.no_grad():
#         for _ in range(30):
#             out = model(cur, edge_index)
#             scaled = out[node_to_idx[product_name]].item()
#             real = scalers[product_name].inverse_transform([[scaled]])[0][0]
#             preds.append(real)

#             cur[node_to_idx[product_name]] = torch.cat(
#                 [cur[node_to_idx[product_name]][1:], 
#                  torch.tensor([[scaled]], dtype=torch.float32)]
#             )

#     return preds

import torch
import numpy as np

def make_prediction(product_name, model, node_to_idx, scalers, last_x, edge_index, days=30):
    """Make prediction for a specific product"""
    
    if product_name not in node_to_idx:
        raise ValueError(f"Product '{product_name}' not found in model")
    
    model.eval()
    preds = []
    cur = last_x.clone()

    with torch.no_grad():
        for _ in range(days):
            out = model(cur, edge_index)
            scaled = out[node_to_idx[product_name]].item()
            real = scalers[product_name].inverse_transform([[scaled]])[0][0]
            preds.append(real)

            cur[node_to_idx[product_name]] = torch.cat(
                [cur[node_to_idx[product_name]][1:], 
                 torch.tensor([[scaled]], dtype=torch.float32)]
            )

    return preds

def batch_predict(product_names, model_data, days=30):
    """Make predictions for multiple products"""
    results = {}
    
    for product_name in product_names:
        try:
            prediction = make_prediction(
                product_name, 
                model_data["model"],
                model_data["node_to_idx"],
                model_data["scalers"], 
                model_data["last_x"],
                model_data["edge_index"],
                days
            )
            results[product_name] = prediction
        except Exception as e:
            results[product_name] = {"error": str(e)}
    
    return results

def validate_model_data(model_data):
    """Validate that model data has all required components"""
    required_keys = ["model", "node_to_idx", "scalers", "last_x", "edge_index"]
    
    for key in required_keys:
        if key not in model_data:
            raise ValueError(f"Missing required model data: {key}")
    
    return True

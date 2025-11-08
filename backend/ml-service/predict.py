def make_prediction(product_name, model, node_to_idx, scalers, last_x, edge_index):

    device = next(model.parameters()).device  # detect CPU/GPU
    model.eval()

    preds = []
    cur = last_x.clone().to(device)
    edge_index = edge_index.to(device)

    with torch.no_grad():
        for _ in range(30):
            out = model(cur, edge_index)
            
            scaled = out[node_to_idx[product_name]].item()
            real = scalers[product_name].inverse_transform([[scaled]])[0][0]
            preds.append(real)

            # update only this product's sequence
            cur[node_to_idx[product_name]] = torch.cat(
                [
                    cur[node_to_idx[product_name]][1:], 
                    torch.tensor([[scaled]], dtype=torch.float32).to(device)
                ]
            )

    return preds

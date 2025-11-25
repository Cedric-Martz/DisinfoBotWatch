from pyspark.sql import DataFrame
import networkx as nx
from pyvis.network import Network
import re


def build_mention_network_simple(dataframe: DataFrame, min_interactions=2, max_nodes=500):
    try:
        rows = dataframe.select("author", "account_category", "content", "publish_date").collect()
        data_list = [row.asDict() for row in rows]
    except Exception as e:
        print(f"Warning: Using pandas conversion with potential compatibility issues: {e}")
        try:
            pdf = dataframe.select("author", "account_category", "content", "publish_date").toPandas()
            data_list = pdf.to_dict('records')
        except Exception as e2:
            print(f"Error converting Spark DataFrame: {e2}")
            print("Could not load data :-( returning empty network")
            return nx.DiGraph()

    print(f"Processing {len(data_list)} tweets...")
    graphic = nx.DiGraph()
    mentions_count = {}
    for row in data_list:
        author = row.get("author")
        content = str(row.get("content", "")) if row.get("content") else ""
        if content and "@" in content:
            matches = re.findall(r'@(\w+)', content)
            for mention in set(matches):
                key = (author, mention)
                mentions_count[key] = mentions_count.get(key, 0) + 1
    for (author, mentioned), count in mentions_count.items():
        if count >= min_interactions:
            graphic.add_edge(author, mentioned, weight=count, interaction_type="mention")
    content_groups = {}
    for row in data_list:
        content = str(row.get("content", ""))
        if content and len(content) > 10:
            if content not in content_groups:
                content_groups[content] = []
            content_groups[content].append(row.get("author"))
    for content, authors in content_groups.items():
        if len(authors) > 2: # we take only groupps larger than 2 to reduce noise
            unique_authors = set(authors)
            authors_list = list(unique_authors)
            for i, author1 in enumerate(authors_list):
                for author2 in authors_list[i+1:]:
                    if graphic.has_edge(author1, author2):
                        graphic[author1][author2]["weight"] += 1
                    else:
                        graphic.add_edge(author1, author2, weight=1, interaction_type="coordinated")

    if graphic.number_of_nodes() > max_nodes:
        print(f"Network too large ({graphic.number_of_nodes()} nodes). Keeping only top {max_nodes} nodes by degree...")
        degrees = dict(graphic.degree())
        top_nodes = sorted(degrees.keys(), key=lambda x: degrees[x], reverse=True)[:max_nodes]
        graphic = graphic.subgraph(top_nodes).copy()
    return graphic


def visualize_network(graphic: nx.Graph, output_path: str = "outputs/network.html",
                     physics_enabled: bool = True, height: str = "750px"):
    try:
        the_network = Network(
            directed=isinstance(graphic, nx.DiGraph),
            height=height
        )
        if physics_enabled:
            the_network.show_buttons(filter_=["physics"])
        for node in graphic.nodes():
            size = min(50, max(10, graphic.degree(node) * 3))
            the_network.add_node(node, title=f"{node} (degree: {graphic.degree(node)})", size=size)
        for source, target, data in graphic.edges(data=True):
            weight = data.get("weight", 1)
            width = min(5, weight * 0.5)
            edge_title = f"{data.get('interaction_type', 'interaction')}: {weight}"
            the_network.add_edge(source, target, title=edge_title, width=width, color="rgba(100, 100, 100, 0.5)")
        import os
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        the_network.write_html(output_path)

        with open(output_path, 'r', encoding='utf-8') as f:
            content = f.read()
        import re
        content = re.sub(r'<script src="lib/bindings/utils\.js"></script>\s*', '', content)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Network visualization saved to {output_path}")
        return output_path
    except Exception as e:
        print(f"Warning: Could not create interactive visualization: {e}")
        print("Creating static visualization instead...")

        try:
            import matplotlib.pyplot as plt
            plt.figure(figsize=(12, 8))
            pos = nx.spring_layout(graphic, k=0.5, iterations=50)
            nx.draw_networkx_nodes(graphic, pos, node_size=50, node_color='lightblue', alpha=0.7)
            nx.draw_networkx_edges(graphic, pos, alpha=0.3, width=0.5)
            nx.draw_networkx_labels(graphic, pos, font_size=8)
            plt.title(f"Network Graph ({graphic.number_of_nodes()} nodes, {graphic.number_of_edges()} edges)")
            plt.axis('off')
            output_png = output_path.replace('.html', '.png')
            os.makedirs(os.path.dirname(output_png) if os.path.dirname(output_png) else ".", exist_ok=True)
            plt.savefig(output_png, dpi=150, bbox_inches='tight')
            plt.close()
            print(f"Static visualization saved to {output_png}")
            return output_png
        except Exception as e2:
            print(f"Could not create any visualization: {e2}")
            return None


def get_network_stats(graphic: nx.Graph) -> dict:
    stats = {
        "nodes": graphic.number_of_nodes(),
        "edges": graphic.number_of_edges(),
        "density": nx.density(graphic),
        "avg_clustering": nx.average_clustering(nx.to_undirected(graphic)) if graphic.number_of_nodes() > 0 else 0,
    }
    if graphic.number_of_nodes() > 0:
        degree_centrality = nx.degree_centrality(graphic)
        betweenness_centrality = nx.betweenness_centrality(graphic)
        stats["top_influencers_by_degree"] = sorted(
            degree_centrality.items(), key=lambda x: x[1], reverse=True
        )[:10]
        stats["top_influencers_by_betweenness"] = sorted(
            betweenness_centrality.items(), key=lambda x: x[1], reverse=True
        )[:10]
    return stats


def network_analysis_improved(dataframe: DataFrame, output_dir: str = "outputs"):
    try:
        graphic = build_mention_network_simple(dataframe)
        print(f"Network created: {graphic.number_of_nodes()} nodes, {graphic.number_of_edges()} edges")
        stats = get_network_stats(graphic)
        print(f"Network density: {stats['density']:.4f}")
        print(f"Average clustering coefficient: {stats['avg_clustering']:.4f}")
        print("\nTop influencers by degree centrality:")
        for account, centrality in stats["top_influencers_by_degree"]:
            print(f"  {account}: {centrality:.4f}")
        if graphic.number_of_nodes() > 0:
            print("\nGenerating network visualization...")
            output_path = visualize_network(graphic, f"{output_dir}/network.html")
            print(f"Network visualization saved to {output_path}")
        return graphic, stats
    except Exception as e:
        print(f"Error during network analysis: {e}")
        import traceback
        traceback.print_exc()
        return None, None

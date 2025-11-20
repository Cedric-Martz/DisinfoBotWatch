from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from pathlib import Path

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)
_cached_data = {}

def load_account_distribution():
    if 'account_dist' in _cached_data:
        return _cached_data['account_dist']
    try:
        csv_files = list(Path("outputs/account_distribution.csv").glob("part-*.csv"))
        if csv_files:
            dataframe = pd.read_csv(csv_files[0])
            dataframe = dataframe.dropna(subset=['account_type', 'account_category'])
            dataframe = dataframe[dataframe['account_type'].str.strip() != '']
            dataframe = dataframe[dataframe['account_category'].str.strip() != '']
            dataframe['count'] = pd.to_numeric(dataframe['count'], errors='coerce')
            dataframe = dataframe.dropna(subset=['count'])
            dataframe['count'] = dataframe['count'].astype(int)
            dataframe = dataframe.fillna('Unknown')
            _cached_data['account_dist'] = dataframe.to_dict('records')
            return _cached_data['account_dist']
    except Exception as e:
        print(f"Error loading account distribution: {e}")
    return []

def load_top_accounts():
    if 'top_accounts' in _cached_data:
        return _cached_data['top_accounts']

    try:
        csv_files = list(Path("outputs/top_active_accounts.csv").glob("part-*.csv"))
        if csv_files:
            dataframe = pd.read_csv(csv_files[0])
            dataframe = dataframe.dropna(subset=['author', 'tweet_count'])
            dataframe = dataframe[dataframe['author'].str.strip() != '']
            dataframe['tweet_count'] = pd.to_numeric(dataframe['tweet_count'], errors='coerce')
            dataframe = dataframe.dropna(subset=['tweet_count'])
            dataframe['tweet_count'] = dataframe['tweet_count'].astype(int)
            dataframe = dataframe.fillna('Unknown')
            _cached_data['top_accounts'] = dataframe.to_dict('records')
            return _cached_data['top_accounts']
    except Exception as e:
        print(f"Error loading top accounts: {e}")
    return []

@app.route('/')
def index():
    return send_from_directory('.', 'static/index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/stats')
def get_stats():
    try:
        top_accounts = load_top_accounts()
        account_dist = load_account_distribution()
        total_bots = sum(item.get('tweet_count', 0) for item in top_accounts)
        unique_bots = len(set(item.get('author', '') for item in top_accounts))
        return jsonify({
            'total_bots': unique_bots,
            'total_tweets': total_bots,
            'unique_accounts': len(account_dist),
            'avg_tweets_per_bot': total_bots // unique_bots if unique_bots > 0 else 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/account-distribution')
def get_account_distribution():
    try:
        data = load_account_distribution()
        sorted_data = sorted(data, key=lambda x: x.get('count', 0), reverse=True)[:50]
        return jsonify(sorted_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/top-accounts')
def get_top_accounts():
    try:
        data = load_top_accounts()
        return jsonify(data[:100])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network')
def get_network():
    if 'network' in _cached_data:
        return jsonify(_cached_data['network'])

    try:
        network_file = Path("outputs/network.html")
        if network_file.exists():
            return jsonify({
                'nodes': [],
                'edges': [],
                'status': 'Generate network using: python main.py'
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network-html')
def get_network_html():
    try:
        import os

        network_file = os.path.join(os.getcwd(), "outputs/network.html")
        if os.path.exists(network_file):
            with open(network_file, 'r', encoding='utf-8') as f:
                content = f.read()
            return content, 200, {'Content-Type': 'text/html; charset=utf-8'}
        return jsonify({'error': 'Network not generated yet'}), 404
    except Exception as e:
        print(f"[DEBUG] Error in get_network_html: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

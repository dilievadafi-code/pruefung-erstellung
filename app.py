# -*- coding: utf-8 -*-
from __future__ import annotations
from pathlib import Path
import random
import tempfile
from flask import Flask, render_template, request, send_file, flash
from exam_generator import load_pool, generate_exams, zip_files, PoolError

BASE_DIR = Path(__file__).resolve().parent
POOL_PATH = BASE_DIR / 'data' / 'fragenpool_itgs_praktiker_200.json'
app = Flask(__name__)
app.secret_key = 'local-only-change-me'

@app.route('/', methods=['GET'])
def index():
    pool = load_pool(POOL_PATH)
    return render_template('index.html', summary=pool['metadata'], rules=pool['exam_rules'])

@app.route('/generate', methods=['POST'])
def generate():
    try:
        count = int(request.form.get('count', '1'))
        count = max(1, min(count, 20))
        title = request.form.get('title', 'IT-Grundschutz-Praktiker Übungsprüfung').strip() or 'IT-Grundschutz-Praktiker Übungsprüfung'
        seed_raw = request.form.get('seed', '').strip()
        seed = int(seed_raw) if seed_raw else random.SystemRandom().randint(1, 10**9)
        include_key = request.form.get('include_key') == 'on'
        avoid_overlap = request.form.get('avoid_overlap') == 'on'
        pool = load_pool(POOL_PATH)
        out_dir = Path(tempfile.mkdtemp(prefix='itgs_pruefungen_'))
        paths, logs = generate_exams(pool, count=count, title_prefix=title, seed=seed, include_key=include_key, avoid_overlap=avoid_overlap, out_dir=out_dir)
        log_path = out_dir / 'auswahlprotokoll.txt'
        log_path.write_text('\n'.join(logs) + f"\nSeed: {seed}\n", encoding='utf-8')
        paths.append(log_path)
        zip_path = out_dir / 'itgs_pruefungen.zip'
        zip_files(paths, zip_path)
        return send_file(zip_path, as_attachment=True, download_name='itgs_pruefungen.zip')
    except (ValueError, PoolError) as exc:
        flash(str(exc), 'error')
        pool = load_pool(POOL_PATH)
        return render_template('index.html', summary=pool['metadata'], rules=pool['exam_rules']), 400

@app.route('/pool-json')
def pool_json():
    return send_file(POOL_PATH, as_attachment=True, download_name='fragenpool_itgs_praktiker_200.json')

@app.route('/pool-word')
def pool_word():
    return send_file(BASE_DIR / 'docs' / 'Fragenpool_ITGS_Praktiker_200.docx', as_attachment=True, download_name='Fragenpool_ITGS_Praktiker_200.docx')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)

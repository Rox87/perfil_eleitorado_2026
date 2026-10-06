import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = "public"

def is_cache_enabled():
    """Verifica a variável de ambiente ENABLE_CACHE (aceita: true, 1, yes, on, sim, s)
       Prioridade: variável do sistema > arquivo .env > padrão 'false'"""
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    file_val = None
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and line.startswith('ENABLE_CACHE='):
                        file_val = line.split('=', 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            pass

    val = os.environ.get('ENABLE_CACHE') or file_val or 'false'
    return str(val).lower() in ('true', '1', 'yes', 'on', 'sim', 's')

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Endpoint dinâmico para injetar a configuração no frontend
        if self.path.startswith('/env.js'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            enabled = is_cache_enabled()
            content = f"window.__ENV__ = Object.freeze({{ ENABLE_CACHE: {str(enabled).lower()} }});\n"
            self.wfile.write(content.encode('utf-8'))
            return

        super().do_GET()

    def end_headers(self):
        # Configuração de cache baseada na variável de ambiente
        if is_cache_enabled():
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    cache_status = is_cache_enabled()
    status_msg = "ATIVADO (max-age=3600)" if cache_status else "DESATIVADO (Atualização em tempo real)"

    print("=" * 60)
    print(f" Servidor do Dashboard Eleições 2026")
    print(f" URL: http://localhost:{PORT}")
    print(f" Variável ENABLE_CACHE: {os.environ.get('ENABLE_CACHE', 'false')} -> {status_msg}")
    print("=" * 60)

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        httpd.serve_forever()

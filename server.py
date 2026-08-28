#!/usr/bin/env python3
"""
Local Dev Server for CHOLD Initiative Website.
Serves static website files AND handles /api/subscribe for Resend email sending!

Usage: python3 server.py [port]
"""
import http.server
import json
import os
import sys
import urllib.request
import urllib.error

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
SITE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chold-initiative-website', 'website')

# Load .env variables
ENV = {}
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                ENV[k.strip()] = v.strip()

RESEND_API_KEY = ENV.get('RESEND_API_KEY') or os.environ.get('RESEND_API_KEY')


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path in ['/api/subscribe', '/.netlify/functions/subscribe']:
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            
            try:
                data = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                data = {}

            email = (data.get('email') or '').strip()
            if not email or '@' not in email:
                self.send_json({'error': 'Please enter a valid email address'}, 400)
                return

            if not RESEND_API_KEY:
                self.send_json({'error': 'RESEND_API_KEY is not configured in .env'}, 500)
                return

            # Call Resend API
            sender = 'CHOLD Initiative <info@choldinitiative.org>'
            
            # Send welcome email
            welcome_req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps({
                    'from': sender,
                    'to': [email],
                    'subject': 'Welcome to CHOLD Initiative Newsletter',
                    'html': f'''
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
                        <div style="background-color: #13501B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                          <h1 style="color: #FFFFFF; font-size: 22px; margin: 0;">CHOLD Initiative</h1>
                          <p style="color: #D4A017; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Center for Holistic Livestock Development</p>
                        </div>
                        <div style="background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; border-radius: 0 0 8px 8px;">
                          <h2 style="color: #13501B; font-size: 18px; margin-top: 0;">Welcome to our newsletter list!</h2>
                          <p>Thank you for subscribing to the Center for Holistic Livestock Development Initiative newsletter.</p>
                          <p>You will now receive our field briefs, policy notes, and operational updates on livestock data systems, disease surveillance, and traditional leadership engagement across Nigeria and Africa.</p>
                          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 25px 0;" />
                          <p style="font-size: 13px; color: #666; margin-bottom: 0;">
                            <strong>CHOLD Initiative Secretariat</strong><br />
                            11 Ukpo Close, off Twon Brass Street, off Mohammed Buhari Way, Garki II, Abuja, Nigeria<br />
                            <a href="mailto:info@choldinitiative.org" style="color: #13501B;">info@choldinitiative.org</a> &middot; +234 (081) 7111 1551
                          </p>
                        </div>
                      </div>
                    '''
                }).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Resend/1.0'
                }
            )

            # Send admin alert
            admin_req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps({
                    'from': sender,
                    'to': ['info@choldinitiative.org'],
                    'subject': f'New Newsletter Subscriber: {email}',
                    'html': f'''
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
                        <div style="background-color: #13501B; padding: 15px 20px; border-radius: 6px 6px 0 0; color: #FFFFFF;">
                          <h2 style="margin: 0; font-size: 18px;">New Newsletter Subscriber Alert</h2>
                        </div>
                        <div style="background-color: #F7F4EC; padding: 20px; border: 1px solid #E5E5E5; border-radius: 0 0 6px 6px;">
                          <p style="margin-top: 0;">A new user has just subscribed to the newsletter on the website.</p>
                          <p><strong>Subscriber Email:</strong> <a href="mailto:{email}" style="color: #13501B; font-weight: bold;">{email}</a></p>
                          <p style="font-size: 12px; color: #777; margin-bottom: 0;">CHOLD Initiative Website Auto-notification</p>
                        </div>
                      </div>
                    '''
                }).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Resend/1.0'
                }
            )

            try:
                with urllib.request.urlopen(welcome_req) as resp:
                    welcome_res = json.loads(resp.read().decode('utf-8'))
                
                try:
                    with urllib.request.urlopen(admin_req) as resp2:
                        pass
                except Exception as e2:
                    print('Admin alert warning:', e2)

                self.send_json({'success': True, 'id': welcome_res.get('id')}, 200)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8')
                print('Resend error:', e.code, err_body)
                try:
                    err_json = json.loads(err_body)
                    msg = err_json.get('message') or 'Resend API error'
                except Exception:
                    msg = err_body
                self.send_json({'error': msg}, e.code)
            except Exception as e:
                print('Server exception:', e)
                self.send_json({'error': 'Server error'}, 500)

        elif self.path in ['/api/apply', '/.netlify/functions/apply']:
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            
            try:
                data = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                data = {}

            name = (data.get('name') or 'Applicant').strip()
            email = (data.get('email') or '').strip()
            phone = (data.get('phone') or 'N/A').strip()
            location = (data.get('location') or 'N/A').strip()
            area = (data.get('area') or 'General Application').strip()
            type_val = (data.get('type') or 'N/A').strip()
            cv = (data.get('cv') or '').strip()
            message = (data.get('message') or '').strip()

            if not email or '@' not in email:
                self.send_json({'error': 'Please enter a valid email address'}, 400)
                return

            if not RESEND_API_KEY:
                self.send_json({'error': 'RESEND_API_KEY is not configured in .env'}, 500)
                return

            sender = 'CHOLD Initiative <info@choldinitiative.org>'

            # Applicant email
            applicant_req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps({
                    'from': sender,
                    'to': [email],
                    'subject': f'Application Received: {area} — CHOLD Initiative',
                    'html': f'''
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
                        <div style="background-color: #13501B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                          <h1 style="color: #FFFFFF; font-size: 22px; margin: 0;">CHOLD Initiative</h1>
                          <p style="color: #D4A017; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Center for Holistic Livestock Development</p>
                        </div>
                        <div style="background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; border-radius: 0 0 8px 8px;">
                          <h2 style="color: #13501B; font-size: 18px; margin-top: 0;">Thank you for applying, {name}!</h2>
                          <p>We have received your expression of interest for the <strong>{area}</strong> role at CHOLD Initiative.</p>
                          <p>Our team reviews all applications carefully. If your background and experience match our current requirements, we will contact you directly to schedule an interview or discuss next steps.</p>
                          <p style="background-color: #F7F4EC; padding: 15px; border-left: 4px solid #13501B; font-size: 14px; color: #444;">
                            <em>Please note that due to the volume of applications, only shortlisted candidates will be contacted.</em>
                          </p>
                          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 25px 0;" />
                          <p style="font-size: 13px; color: #666; margin-bottom: 0;">
                            <strong>CHOLD Initiative Secretariat</strong><br />
                            11 Ukpo Close, off Twon Brass Street, off Mohammed Buhari Way, Garki II, Abuja, Nigeria<br />
                            <a href="mailto:info@choldinitiative.org" style="color: #13501B;">info@choldinitiative.org</a> &middot; +234 (081) 7111 1551
                          </p>
                        </div>
                      </div>
                    '''
                }).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Resend/1.0'
                }
            )

            # Admin alert email
            admin_req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps({
                    'from': sender,
                    'to': ['info@choldinitiative.org'],
                    'subject': f'New Job Application: {name} ({area})',
                    'html': f'''
                      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #222; line-height: 1.6; padding: 20px;">
                        <div style="background-color: #13501B; padding: 15px 20px; border-radius: 6px 6px 0 0; color: #FFFFFF;">
                          <h2 style="margin: 0; font-size: 18px;">New Job Application Alert</h2>
                        </div>
                        <div style="background-color: #FFFFFF; padding: 25px; border: 1px solid #E5E5E5; border-radius: 0 0 6px 6px;">
                          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Applicant Name:</td><td>{name}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Email Address:</td><td><a href="mailto:{email}" style="color:#13501B;">{email}</a></td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Phone Number:</td><td>{phone}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Location:</td><td>{location}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Role / Area:</td><td><strong>{area}</strong></td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Engagement:</td><td>{type_val}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">CV / Link:</td><td><a href="{cv}" target="_blank" style="color:#13501B;">{cv}</a></td></tr>
                          </table>
                          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 15px 0;" />
                          <p style="font-weight: bold; margin-bottom: 5px;">Experience &amp; Background Statement:</p>
                          <div style="background-color: #F7F4EC; padding: 12px 15px; border-radius: 6px; white-space: pre-wrap; font-size: 13.5px; color: #333;">{message}</div>
                        </div>
                      </div>
                    '''
                }).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Resend/1.0'
                }
            )

            try:
                with urllib.request.urlopen(applicant_req) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                
                try:
                    with urllib.request.urlopen(admin_req) as resp2:
                        pass
                except Exception as e2:
                    print('Admin application alert error:', e2)

                self.send_json({'success': True, 'id': res_data.get('id')}, 200)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8')
                print('Resend application error:', e.code, err_body)
                self.send_json({'error': err_body}, e.code)
            except Exception as e:
                print('Application server exception:', e)
                self.send_json({'error': 'Server error'}, 500)
        else:
            self.send_error(404, "File not found")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    print(f"Starting CHOLD Local Server at http://localhost:{PORT}")
    server = http.server.HTTPServer(('0.0.0.0', PORT), DevHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")

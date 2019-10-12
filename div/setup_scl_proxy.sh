#!/bin/sh
set -e


sudo apt update && sudo apt dist-upgrade -y
sudo apt install -y apache2 php certbot python-certbot-apache unzip php-curl

sudo mkdir /var/www/bupproxy
sudo rm -rf /var/www/bupproxy/*
sudo chown ubuntu:ubuntu /var/www/bupproxy
mkdir /var/www/bupproxy/static/
(
    cd /var/www/bupproxy/static/ &&
    wget https://aufschlagwechsel.de/bup.zip -O bup.zip
    unzip bup.zip
    mv bup/div/bupdate.php ..
)

echo '
<VirtualHost *:80>
    ServerName scl.aufschlagwechsel.de

    <Directory /var/www/bupproxy/>
    Options FollowSymlinks
    AllowOverride All
    </Directory>

    SSLProxyEngine On
    DocumentRoot /var/www/bupproxy/
    ProxyPass /static/bup/ !
    ProxyPass / https://shuttlecock-live.com/
    ProxyPassReverse / https://shuttlecock-live.com/
</VirtualHost>
' | sudo tee /etc/apache2/sites-available/001-scl.conf > /dev/null
sudo a2enmod proxy_http ssl rewrite
sudo a2ensite 001-scl
sudo a2dissite 001-scl-le-ssl
sudo rm -f /etc/apache2/sites-available/001-scl-le-ssl.conf
sudo service apache2 restart

sudo certbot -n --apache --agree-tos --email phihag@phihag.de --domains scl.aufschlagwechsel.de --redirect


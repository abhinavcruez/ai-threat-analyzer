#!/bin/bash
# AI Threat Analyzer - Auto Discovery Agent
# Usage: curl -sL https://raw.githubusercontent.com/YourUsername/ai-threat-analyzer/main/scan_assets.sh | bash -s -- <BACKEND_URL> <AUTH_TOKEN>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <BACKEND_URL> <AUTH_TOKEN>"
    exit 1
fi

BACKEND_URL=$1
TOKEN=$2
IP_ADDRESS=$(hostname -I | awk '{print $1}')
HOSTNAME=$(hostname)

# Get OS Info
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$PRETTY_NAME
else
    OS_NAME="Linux System"
fi

KERNEL=$(uname -r)

echo "Registering Host System ($HOSTNAME - $OS_NAME)..."
# Send Host to backend
curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/assets" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{
           \"name\": \"Host: $HOSTNAME\",
           \"type\": \"Server\",
           \"version\": \"$OS_NAME\",
           \"ip_address\": \"$IP_ADDRESS\",
           \"status\": \"online\",
           \"details\": \"Kernel: $KERNEL\"
         }"
echo ""

echo "Scanning ALL Active Services..."
# Dynamically find all active services, filtering out internal OS noise
ACTIVE_SERVICES=$(systemctl list-units --type=service --state=active --no-legend | awk '{print $1}' | sed 's/\.service//' | grep -vE 'systemd|getty|dbus|polkit|plymouth|modprobe|wpa_supplicant|upower|rtkit|networkd|resolved|timesyncd|user@')

for SERVICE in $ACTIVE_SERVICES; do
    # Format the name for presentation
    NAME="$SERVICE (on $HOSTNAME)"

    # Try to extract the version using dpkg
    VERSION=$(dpkg-query -W -f='${Version}' $SERVICE 2>/dev/null | cut -d':' -f2 | cut -d'-' -f1)
    
    if [ -z "$VERSION" ]; then
        VERSION="Unknown"
    fi

    STATUS="active"
    DETAILS=$(systemctl status $SERVICE | grep "Active:" | xargs)

    echo "Found: $NAME (Version: $VERSION, Status: $STATUS)"

    # Send to the backend
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/assets" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "{
               \"name\": \"$NAME\",
               \"type\": \"Service\",
               \"version\": \"$VERSION\",
               \"ip_address\": \"$IP_ADDRESS\",
               \"status\": \"$STATUS\",
               \"details\": \"$DETAILS\"
             }")

    if [ "$RESPONSE" -eq 201 ]; then
        echo "  -> Successfully registered to Threat Analyzer"
    else
        echo "  -> Failed to register (HTTP $RESPONSE)"
    fi
done

echo "Scan complete!"

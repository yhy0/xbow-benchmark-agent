#!/usr/bin/env bash
set -euo pipefail

echo "==> Removing old Docker packages..."
sudo apt remove -y $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc 2>/dev/null | cut -f1) 2>/dev/null || true

echo "==> Installing prerequisites..."
sudo apt update
sudo apt install -y ca-certificates curl

echo "==> Adding Docker's official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "==> Adding Docker repository..."
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

echo "==> Installing Docker..."
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "==> Adding current user to docker group..."
sudo usermod -aG docker "$USER"

echo "==> Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh

echo ""
echo "==> Done! Log out and back in for docker group to take effect."

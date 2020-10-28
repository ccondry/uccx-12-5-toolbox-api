#!/bin/sh
echo "running yarn"
yarn
if [ $? -eq 0 ]; then
  echo "edit .env file first"
  vim .env
  echo "installing systemd service..."
  sudo cp systemd.service /lib/systemd/system/uccx-12-5-toolbox-api.service
  echo "enabling systemd service..."
  sudo systemctl enable uccx-12-5-toolbox-api.service
  echo "starting systemd service..."
  systemctl start uccx-12-5-toolbox-api.service
  echo "install uccx-12-5-toolbox-api.service is complete."
else
  echo "yarn failed"
fi

#!/bin/bash

if [ -d "curl_testing" ]; then
  chmod +x curl_testing/*.sh
  echo "✅ Made all scripts in curl_testing/ executable"
else
  echo "⚠️ curl_testing/ folder not found!"
fi
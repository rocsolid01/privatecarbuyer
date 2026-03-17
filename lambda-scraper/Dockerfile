# ─────────────────────────────────────────────────────────────────────────────
# Private Car Buyer — AWS Lambda Scraper Container
# Base: Official AWS Lambda Python 3.12 image (Amazon Linux 2023)
# ─────────────────────────────────────────────────────────────────────────────
FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies required by Chromium/Playwright on Amazon Linux 2023
RUN dnf install -y \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXtst \
    pango \
    at-spi2-core \
    libdrm \
    mesa-libgbm \
    libxshmfence \
    nss \
    nspr \
    alsa-lib \
    libxkbcommon \
    && dnf clean all

# Force rebuild of subsequent layers
RUN echo "Final Deployment: 1773713800" > /build_info

# Set Playwright browser path within the task root
ENV PLAYWRIGHT_BROWSERS_PATH=${LAMBDA_TASK_ROOT}/pw-browsers

# Install Python dependencies directly to the task root
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Install Chromium browser binary via Playwright
RUN python -m playwright install chromium

# Copy scraper source
COPY scraper.py ${LAMBDA_TASK_ROOT}/

# Lambda handler entry point
CMD ["scraper.handler"]

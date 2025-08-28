# .NET SDK for building/running your backend
FROM mcr.microsoft.com/dotnet/sdk:8.0

# Avoid interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# ---------- Base tools ----------
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git unzip sudo bash-completion \
    build-essential pkg-config openssh-client \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# ---------- Node.js (LTS) ----------
# (Install the current LTS; adjust version if you need a specific one)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ---------- Non-root user (recommended for dev containers) ----------
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ---------- Global npm utils you might want ----------
RUN npm i -g pnpm yarn typescript eslint npm-check-updates

# Workspace convention
WORKDIR /workspace
USER $USERNAME

# Default command
CMD [ "bash" ]

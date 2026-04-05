FROM node:22-bullseye AS build

WORKDIR /app

# Set base variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV API_HOST=::
ENV API_PORT=8000
EXPOSE ${API_PORT}

# Copy files
COPY . .

# Enable corepack
RUN corepack enable

# Install
RUN yarn install --frozen-lockfile --immutable
RUN yarn prebuild
RUN yarn build

# Run
CMD [ "yarn", "start" ]

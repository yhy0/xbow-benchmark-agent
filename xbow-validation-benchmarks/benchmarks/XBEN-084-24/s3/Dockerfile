FROM node:16-alpine

RUN apk --no-cache add curl
WORKDIR /app
COPY . .
RUN npm install 
EXPOSE 8333
CMD [ "npm", "start" ]

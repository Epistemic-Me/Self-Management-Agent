# Server

The project is hosted on a t2.medium instance in AWS. There is an ElasticIP connected to the instance. The security group opens up various ports to allow external traffic to hit the instance. You can use AWS EC2 connect to SSH into the instance from the AWS console. The web-ui automatically boots up via pm2. The backend is manually started using make up. 

## Updating

```
mv DD-MCP DD-MCP-old
git pull
rm -rf DD-MCP
mv DD-MCP-old DD-MCP
docker compose down
docker compose up
cd web-ui
npm run build
pm2 restart web-ui
```

## Troubleshooting

### Docker Compose

```
docker compose logs
```

### UI

```
pm2 logs
```

## Log

- Running backend using `make up`.
- Running web-ui repo with pm2.
- Added nginx forwarding of port 443 to 3000.
- Created AMI for moving from t2.micro to t2.medium instance.
- Cloned repos onto instance.
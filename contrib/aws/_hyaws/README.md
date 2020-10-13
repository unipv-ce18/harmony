This is a highly specialized cloud client to semi-automatically configure a reproducible AWS deploy for Harmony
(a.k.a. a tool made in a disperate attempt to make a heavily marketed corporate cloud solution appealing to the team).

#### Authenticating

Copy and paste your AWS CLI credentials in a `credentials` file in this folder.

if you are using the AWS Educate account provided by the course, use the credentials given inside the _Account Details_
popup on the Vocareum site.
  
Otherwise you can create an access key for `hyaws` in your IAM page (or better, create a user with limited
 access and add a key to it).

Your credentials file should be in this format:

```ini
[badass account]
aws_access_key_id=ACCESS_KEY_ID
aws_secret_access_key=SECRET_ACCESS_KEY

[my edu account]
aws_access_key_id=ACCESS_KEY_ID
aws_secret_access_key=SECRET_ACCESS_KEY
aws_session_token=SESSION_TOKEN
```

Section names are ignored, so you can give them any name/description as you wish. `hyaws` attempts to get the user
 identity for each account in this file and to map it to account names in your `deploy.yml` file.

#### Using

Run `hyaws.py` to see the accounts that have been recognized by `hyaws` for the current deploy, plus a list of services
that can be managed through the utility. Running `hyaws.py help <service>` gives a description of the commands
available for the named service and no, `help koda` or similar crap does not work.

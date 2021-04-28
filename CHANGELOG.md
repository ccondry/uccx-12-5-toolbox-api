# uccx-12-5-toolbox-api Change Log

Version numbers are semver-compatible dates in YYYY.MM.DD-X format,
where X is the revision number


# 2021.4.28
### Fixes
* **Provision:** Generate username from hash of user email address, to fix
provisioning users with email addresses as their username. Also fixed the
password reset part of provisioning.
* **Reset Password:** Implement the password reset route.


# 2021.4.12
### Features
* **Provision:** Reset user VPN password during reprovision.
* **Reset Password:** Implement the password reset route.


# 2021.2.3
### Features
* **Provision:** reduce email CSQ template polling duration to 60 seconds. Track
user last access time.

### Bug Fixes
* **Provision:** add bubble chat widget ID during provisioning


# 2021.1.14-2
### Bug Fixes
* **Provision:** fix Finesse team sync provision status variable


# 2021.1.14-1
### Bug Fixes
* **Provision:** fix Finesse team layout copy, add more config values to .env
file


# 2021.1.13
### Bug Fixes
* **Provision:** remove extra check for max users during provision


# 2021.1.11-1
### Bug Fixes
* **Provision:** fixed an issue where sometimes the Finesse team layout would
not get set if Finesse did not sync fast enough
* **Deprovision:** remove email account when deprovisioning users


# 2021.1.11
### Features
* **Release:** QA release


# 2020.12.16
### Features
* **System:** All provision features working in development


# 2020.10.27
### Features
* **Created:** Created

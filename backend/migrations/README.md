# Database migrations

The initial MySQL schema is in `../sql/schema.sql`. Import it once into an empty shop database using phpMyAdmin. There is currently no automatic migration runner; place future incremental SQL changes in this folder with numbered filenames and apply them in order after backing up the database.

Admin accounts, roles, products, categories, settings and social links are stored in MySQL. The CMS creates those tables on the first request and copies any content still saved in `../data/cms.json`. R2 stores uploaded image files; the database stores their public URLs.

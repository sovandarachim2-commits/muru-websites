# Database migrations

The initial MySQL schema is in `../sql/schema.sql`. Import it once into an empty shop database using phpMyAdmin. There is currently no automatic migration runner; place future incremental SQL changes in this folder with numbered filenames and apply them in order after backing up the database.

Admin users, roles and CMS content currently use `../data/cms.json`, not MySQL tables. The roles and R2 upload changes do not require a SQL migration. R2 stores uploaded image files; CMS content stores their public URLs.

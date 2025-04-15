const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function migrateImages() {
    console.log('Starting image data migration...');

    // Begin transaction
    await new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    try {
        // Get all images from old table
        const rows = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM images', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        console.log(`Found ${rows.length} images to migrate`);

        // Migrate each image
        for (const row of rows) {
            const modelConfig = {
                model: "black-forest-labs/FLUX.1-schnell-Free",
                width: 512,
                height: 512,
                steps: 2,
                n: 1,
                response_format: "b64_json",
                prompt: row.prompt
            };

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO image_generations (
                        chat_id,
                        user_id,
                        prompt,
                        image_data,
                        model_used,
                        width,
                        height,
                        generation_config,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        row.chat_id,
                        row.user_id,
                        row.prompt,
                        row.image_data,
                        modelConfig.model,
                        modelConfig.width,
                        modelConfig.height,
                        JSON.stringify(modelConfig),
                        row.created_at
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Drop old table
        await new Promise((resolve, reject) => {
            db.run('DROP TABLE IF EXISTS images', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Migration completed successfully');
    } catch (error) {
        // Rollback on error
        await new Promise((resolve, reject) => {
            db.run('ROLLBACK', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.error('Migration failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

migrateImages().catch(console.error);
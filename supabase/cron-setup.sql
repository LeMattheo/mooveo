-- Configuration pg_cron — À exécuter APRÈS déploiement de la Edge Function send-notifications
-- Remplacer <PROJECT_REF> et <VOTRE_SERVICE_ROLE_KEY>

ALTER DATABASE postgres SET app.supabase_url = 'https://<PROJECT_REF>.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<VOTRE_SERVICE_ROLE_KEY>';

SELECT cron.schedule(
  'send-notifications',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

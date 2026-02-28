// Déploiement : supabase functions deploy send-notifications
// Déclenchement : pg_cron toutes les 5 minutes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
const FROM_EMAIL = 'Sportify Rural <noreply@sportify-rural.fr>'

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

const templates: Record<string, (data: { event: Record<string, unknown>; profile: Record<string, unknown> }) => { subject: string; html: string }> = {
  join_confirm: ({ event, profile }) => ({
    subject: `✅ Inscription confirmée — ${event.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Inscription confirmée !</h2>
        <p>Bonjour ${(profile.full_name as string) || profile.username},</p>
        <p>Votre inscription à la sortie <strong>${event.title}</strong> est bien enregistrée.</p>
        <table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%">
          <tr><td><strong>📅 Date</strong></td><td>${formatDate(event.event_date as string)}</td></tr>
          <tr><td><strong>📍 Lieu</strong></td><td>${event.meeting_name}</td></tr>
          <tr><td><strong>🏃 Sport</strong></td><td style="text-transform:capitalize">${event.sport}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:12px">Vous recevrez un rappel la veille et 2h avant le départ.</p>
      </div>
    `,
  }),

  reminder_j1: ({ event, profile }) => ({
    subject: `⏰ Rappel J-1 — ${event.title} demain !`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">C'est demain !</h2>
        <p>Bonjour ${(profile.full_name as string) || profile.username},</p>
        <p>Rappel : vous avez une sortie <strong>${event.sport}</strong> demain.</p>
        <table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%">
          <tr><td><strong>📅 Date</strong></td><td>${formatDate(event.event_date as string)}</td></tr>
          <tr><td><strong>📍 Rendez-vous</strong></td><td>${event.meeting_name}</td></tr>
        </table>
        <p>Pensez à préparer votre équipement ce soir ! 🎒</p>
      </div>
    `,
  }),

  reminder_h2: ({ event, profile }) => ({
    subject: `🚀 Dans 2h — ${event.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Dans 2 heures !</h2>
        <p>Bonjour ${(profile.full_name as string) || profile.username},</p>
        <p>Votre sortie commence dans <strong>2 heures</strong>.</p>
        <p>📍 Rendez-vous à <strong>${event.meeting_name}</strong></p>
        <p>Bonne sortie ! 💪</p>
      </div>
    `,
  }),

  cancellation: ({ event, profile }) => ({
    subject: `❌ Sortie annulée — ${event.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#ef4444">Sortie annulée</h2>
        <p>Bonjour ${(profile.full_name as string) || profile.username},</p>
        <p>Malheureusement, la sortie <strong>${event.title}</strong> du ${formatDate(event.event_date as string)} a été annulée par l'organisateur.</p>
        <p><a href="${Deno.env.get('APP_URL')}/events" style="color:#2563eb">Voir d'autres sorties →</a></p>
      </div>
    `,
  }),
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { data: jobs, error } = await supabase
      .from('notification_jobs')
      .select(`
        id, type, event_id, user_id,
        events ( title, event_date, meeting_name, sport ),
        profiles ( username, full_name )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)

    if (error) throw error
    if (!jobs?.length) {
      return new Response(JSON.stringify({ processed: 0, message: 'No pending jobs' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    let failed = 0

    for (const job of jobs) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(job.user_id)
        if (authError || !authUser.user?.email) {
          throw new Error(`No email for user ${job.user_id}`)
        }

        const tpl = templates[job.type]
        if (!tpl) throw new Error(`Unknown notification type: ${job.type}`)

        const event = job.events as Record<string, unknown>
        const profile = job.profiles as Record<string, unknown>
        const { subject, html } = tpl({ event, profile })

        const { error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: authUser.user.email,
          subject,
          html,
        })

        if (emailError) throw emailError

        await supabase
          .from('notification_jobs')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', job.id)

        sent++
      } catch (err) {
        console.error(`Failed to process job ${job.id}:`, err)
        await supabase
          .from('notification_jobs')
          .update({ status: 'failed' })
          .eq('id', job.id)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ processed: sent + failed, sent, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

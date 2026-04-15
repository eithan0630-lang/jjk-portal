export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code manquant' });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.DISCORD_REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).json({ error: 'Token invalide' });

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  const memberRes = await fetch(
    `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const member = await memberRes.json();

  const roleMap = {
    [process.env.ROLE_FOUNDER_ID]: 'founder',
    [process.env.ROLE_ADMIN_ID]:   'admin',
    [process.env.ROLE_MJ_ID]:      'mj',
    [process.env.ROLE_MODO_ID]:    'modo',
  };

  let siteRole = 'player';
  if (member.roles) {
    for (const [discordRoleId, siteRoleName] of Object.entries(roleMap)) {
      if (member.roles.includes(discordRoleId)) {
        siteRole = siteRoleName;
        break;
      }
    }
  }

  const params = new URLSearchParams({
    id:       user.id,
    username: user.username,
    avatar:   user.avatar || '',
    role:     siteRole,
  });

  res.redirect(`/?discord_auth=${encodeURIComponent(params.toString())}`);
}
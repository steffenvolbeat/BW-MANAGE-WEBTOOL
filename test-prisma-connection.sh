#!/bin/bash
echo "🔍 Teste Prisma DB-Verbindung..."
cd /home/nu-metal-ubuntu/Schreibtisch/BW-MANAGE-WEBTOOL
npx prisma db execute --stdin <<SQL
SELECT 1 as test;
SQL
echo ""
echo "✅ Wenn du '{ test: 1 }' siehst → DB ist wieder erreichbar!"
echo "❌ Wenn Fehler 'planLimitReached' → Upgrade noch nicht aktiv (warte 1-2 Min)"

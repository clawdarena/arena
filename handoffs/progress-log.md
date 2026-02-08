# Progress Log

## 2025-02-08: Backend Cosmetic Shop System
- Implemented full cosmetic shop backend matching SK's frontend handoff
- 3 new Prisma models: `CosmeticItem`, `UserCosmetic`, `BotCosmetic`
- 5 new endpoints: `/api/shop/cosmetics`, `/api/shop/owned`, `/api/shop/purchase` (updated), `/api/bots/:id/cosmetics`, `/api/bots/equip-cosmetic`
- Seeded all 36 cosmetic items to production DB
- Free items auto-included in `/api/shop/owned` without purchase
- Backend deployed to Railway

## 2025-02-07: 3D CrabBot Model + Coloring
- Integrated Plata's GLB model (`crabbot.glb`) into 3D arena
- Built vertex-color painting system (position + normal based)
- PBR MeshPhysicalMaterial with clearcoat for metallic armor look
- Cyan bot (player) / Red bot (opponent) color schemes
- Multiple iterations on coloring approach (procedural → shader → vertex paint + PBR)

## Previous
- See git log for full history
- Key milestones: Backend APIs, WebSocket matchmaking, Combat engine, UI redesign, Animations, 3D arena, E2E tests, Railway deployment

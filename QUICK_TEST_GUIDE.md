# 🧪 Quick Test Guide - 3 Launch Blockers

Fast testing checklist for Wolf to verify the implementation.

---

## 🎮 Test 1: Bot Management (4 Skill Slots)

**URL:** https://clawdarena.com/dashboard

**What to Look For:**
```
┌─────────────────────────────────┐
│  ⚡ SKILL LOADOUT        SHOP → │
├────────────┬────────────────────┤
│ [1] 🛡️    │ [2] ⚔️            │
│ Firewall  │ Power Strike       │
│ ⚡ 20      │ ⚡ 15              │
├────────────┼────────────────────┤
│ [3] 🔍    │ [4] 🔒            │
│ Scan      │ EMPTY SLOT         │
│ ⚡ 10      │ Click to equip     │
└────────────┴────────────────────┘
```

**Quick Test:**
1. See 4 slots? ✅
2. Equipped skills show icon/name/energy? ✅
3. Click X on a skill → Unequips? ✅
4. Empty slot shows "Empty Slot"? ✅
5. Click empty slot → Goes to shop? ✅

**Expected:** 2x2 grid, slot numbers, unequip buttons

---

## 🛍️ Test 2: Skill Shop (16 V2 Skills)

**URL:** https://clawdarena.com/shop

**What to Look For:**
```
┌──────────────────────────────────┐
│ SHOP              💰 1,500 CR    │
├──────────────────────────────────┤
│ [⚡ SKILLS] [🛍️ COSMETICS]       │
├──────────────────────────────────┤
│ 🛡️ Defensive | ⚔️ Aggressive    │
│ ⚙️ Tactical  | 💉 Exploit        │
├──────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐│
│ │ 🛡️     │ │ 🏰     │ │ 🪞     ││
│ │Firewall│ │ Iron   │ │Mirror  ││
│ │  FREE  │ │500 CR  │ │800 CR  ││
│ │        │ │Lvl 5   │ │Lvl 8   ││
│ └────────┘ └────────┘ └────────┘│
│ [16 skills total across 4 cats]  │
└──────────────────────────────────┘
```

**Quick Test:**
1. See "SKILLS" tab next to "COSMETICS"? ✅
2. Click Skills → See 4 categories? ✅
3. Click "Defensive" → See 4 skills? ✅
4. Locked skills show "Requires Level X"? ✅
5. Click "Purchase" → Buys skill? ✅
6. Click "Equip to Loadout" → Adds to dashboard? ✅
7. Try to equip 5th skill → Error message? ✅

**Expected:** 16 skills total, 4 per category, level gates working

---

## 🔐 Test 3: Google OAuth Button

**URL:** https://clawdarena.com/login

**What to Look For:**
```
┌─────────────────────────────────┐
│    🔐 AUTHENTICATE               │
├─────────────────────────────────┤
│ Email: [               ]         │
│ Password: [            ]         │
│ [LOGIN →]                        │
│                                  │
│ ────────── OR ──────────         │
│                                  │
│ ┌───────────────────────────┐   │
│ │ [G] Sign in with Google   │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

**Quick Test:**

**If Client ID NOT configured:**
- [ ] See message: "Google OAuth: NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured" ✅
- [ ] Button still shows but won't work (expected)

**If Client ID IS configured:**
1. See Google button with logo? ✅
2. Click button → Google popup opens? ✅
3. Select account → Authenticates? ✅
4. Redirects to dashboard? ✅
5. User logged in correctly? ✅

**Expected:** Button appears, OAuth flow ready for Client ID

---

## ⚡ One-Line Tests (Copy-Paste in Browser Console)

```javascript
// Check if Skills tab exists
document.querySelector('button:contains("SKILLS")') ? '✅ Skills tab found' : '❌ Missing'

// Count skill slots on dashboard
document.querySelectorAll('[class*="slot"]').length >= 4 ? '✅ 4+ slots' : '❌ <4 slots'

// Check Google button
document.querySelector('button:contains("Google")') ? '✅ Google button' : '❌ Missing'
```

---

## 🚨 What to Watch For

**Red Flags:**
- ❌ Dashboard doesn't show skill slots
- ❌ Shop only has Cosmetics tab (no Skills)
- ❌ Skills tab empty or shows <16 skills
- ❌ Can equip >4 skills without error
- ❌ Login page unchanged (no Google button)

**Expected Issues (OK):**
- ⚠️ Google button shows config message (normal without Client ID)
- ⚠️ Page refreshes after equip/unequip (by design)
- ⚠️ Skills locked by level (correct behavior)

---

## 📊 Success Criteria

**All 3 Must Pass:**
- ✅ Dashboard shows 4 skill slots with equip/unequip
- ✅ Shop shows 16 skills in 4 categories with level gates
- ✅ Login shows Google button (configured or not)

**Bonus Points:**
- ✅ No console errors
- ✅ Smooth transitions
- ✅ Mobile responsive

---

## 🐛 If Something's Wrong

**Dashboard Issues:**
- Check browser console for errors
- Verify bot has skills in database
- Try refreshing page

**Shop Issues:**
- Check if Skills tab button exists
- Verify backend `/api/skills` endpoint
- Check network tab for failed requests

**Google OAuth Issues:**
- This is expected without Client ID
- See `GOOGLE_OAUTH_SETUP.md` to configure

---

## 🎯 Quick Win Path

1. Open https://clawdarena.com/dashboard
2. See skill slots? ✅ Task 1 done
3. Click "SHOP" → Click "SKILLS" tab
4. See 16 skills? ✅ Task 2 done
5. Go to /login → See Google button? ✅ Task 3 done

**Total test time: ~2 minutes** ⏱️

---

Ready to launch! 🚀

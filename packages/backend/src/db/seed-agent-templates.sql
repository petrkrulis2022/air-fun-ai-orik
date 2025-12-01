-- Seed agent templates for air.fun MVP
-- These are the 4 pre-built agent templates

-- Clear existing templates (for re-seeding)
DELETE FROM agent_templates;

-- 1. Buy Button Agent
INSERT INTO agent_templates (id, name, description, type, model_url, default_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Buy Button',
  'A simple, eye-catching buy button that allows viewers to purchase tokens with one click',
  'buy_button',
  'https://air-fun-assets.s3.amazonaws.com/models/buy-button.glb',
  '#00FF00'
);

-- 2. Challenge Giver Agent
INSERT INTO agent_templates (id, name, description, type, model_url, default_color)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Challenge Giver',
  'An interactive agent that presents challenges to viewers with token rewards for completion',
  'challenge_giver',
  'https://air-fun-assets.s3.amazonaws.com/models/challenge-giver.glb',
  '#FF6B00'
);

-- 3. Predictor Agent
INSERT INTO agent_templates (id, name, description, type, model_url, default_color)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Predictor',
  'An agent that allows viewers to make predictions about stream outcomes and token price movements',
  'predictor',
  'https://air-fun-assets.s3.amazonaws.com/models/predictor.glb',
  '#9D00FF'
);

-- 4. Leaderboard Agent
INSERT INTO agent_templates (id, name, description, type, model_url, default_color)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Leaderboard',
  'Displays top token holders and biggest buyers, encouraging competitive purchasing',
  'leaderboard',
  'https://air-fun-assets.s3.amazonaws.com/models/leaderboard.glb',
  '#FFD700'
);

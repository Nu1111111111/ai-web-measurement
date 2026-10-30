# Results (generated)

Generated 2026-10-29T15:44:24.210Z by `node src/results-md.js` from results/*/results.json.
Do not edit by hand. Shares: percent (k/n) [Wilson 95 % CI]; unit = domain; denominator = comparable domains.

## wave1-head

Analysis generated 2026-10-29T13:51:06.598Z.

### wave1-head-de-residential

Vantage: de-residential DE AS3320 Deutsche Telekom AG
Funnel: listed 10000, opted out 0, robots.txt unreachable 2069, robots.txt disallows study 233, no website 139, probed 7559, comparable 6042.

Any AI agent (per domain):

- declaredFullBlock: 13.7 % (830/6042) [12.9, 14.6]
- servedBlocked: 19.7 % (1188/6042) [18.7, 20.7]
- aiSpecificBlock: 15.0 % (908/6042) [14.1, 16.0]
- payment: 1.1 % (66/6042) [0.9, 1.4]
- aiSpecificDiff: 2.1 % (128/6042) [1.8, 2.5]
- enforcedDespiteAllowed: 12.1 % (731/6042) [11.3, 12.9]

RQ2 upper bound (no manual coding):

- anyAiDiff: 2.1 % (128/6042) [1.8, 2.5]
- anySearchEngineDiff: 2.1 % (125/6042) [1.7, 2.5]
- aiOnlyDiff: 1.0 % (59/6042) [0.8, 1.3]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.1 % (8/6042) [0.1, 0.3] | 6.2 % (377/6042) [5.7, 6.9] | 3.9 % (237/6042) [3.5, 4.4] | 0.0 % (1/6042) [0.0, 0.1] | 1.9 % (116/6042) [1.6, 2.3] |
| bingbot | reference | 0.2 % (12/6042) [0.1, 0.3] | 6.4 % (385/6042) [5.8, 7.0] | 4.0 % (244/6042) [3.6, 4.6] | 0.0 % (1/6042) [0.0, 0.1] | 1.8 % (106/6042) [1.5, 2.1] |
| gptbot | training | 10.6 % (641/6042) [9.9, 11.4] | 12.2 % (739/6042) [11.4, 13.1] | 9.6 % (583/6042) [8.9, 10.4] | 0.6 % (34/6042) [0.4, 0.8] | 1.2 % (71/6042) [0.9, 1.5] |
| oai-searchbot | search | 3.4 % (208/6042) [3.0, 3.9] | 6.5 % (393/6042) [5.9, 7.2] | 4.0 % (239/6042) [3.5, 4.5] | 0.6 % (38/6042) [0.5, 0.9] | 1.1 % (65/6042) [0.8, 1.4] |
| chatgpt-user | user | 4.8 % (287/6042) [4.2, 5.3] | 6.8 % (413/6042) [6.2, 7.5] | 4.6 % (278/6042) [4.1, 5.2] | 0.6 % (39/6042) [0.5, 0.9] | 1.1 % (67/6042) [0.9, 1.4] |
| claudebot | training | 9.3 % (564/6042) [8.6, 10.1] | 13.0 % (783/6042) [12.1, 13.8] | 10.2 % (616/6042) [9.5, 11.0] | 0.6 % (34/6042) [0.4, 0.8] | 1.0 % (59/6042) [0.8, 1.3] |
| claude-searchbot | search | 2.7 % (163/6042) [2.3, 3.1] | 4.9 % (299/6042) [4.4, 5.5] | 3.1 % (185/6042) [2.7, 3.5] | 0.4 % (26/6042) [0.3, 0.6] | 0.8 % (47/6042) [0.6, 1.0] |
| claude-user | user | 2.9 % (173/6042) [2.5, 3.3] | 4.5 % (274/6042) [4.0, 5.1] | 3.1 % (189/6042) [2.7, 3.6] | 0.4 % (22/6042) [0.2, 0.6] | 0.7 % (41/6042) [0.5, 0.9] |
| perplexitybot | search | 5.6 % (341/6042) [5.1, 6.3] | 7.1 % (429/6042) [6.5, 7.8] | 4.6 % (277/6042) [4.1, 5.1] | 0.7 % (41/6042) [0.5, 0.9] | 1.1 % (66/6042) [0.9, 1.4] |
| perplexity-user | user | 3.0 % (181/6042) [2.6, 3.5] | 5.3 % (320/6042) [4.8, 5.9] | 3.5 % (211/6042) [3.1, 4.0] | 0.6 % (39/6042) [0.5, 0.9] | 1.1 % (68/6042) [0.9, 1.4] |
| meta-externalagent | training | 8.1 % (487/6042) [7.4, 8.8] | 8.4 % (505/6042) [7.7, 9.1] | 5.7 % (343/6042) [5.1, 6.3] | 0.6 % (36/6042) [0.4, 0.8] | 1.0 % (61/6042) [0.8, 1.3] |
| ccbot | training | 11.1 % (668/6042) [10.3, 11.9] | 11.4 % (687/6042) [10.6, 12.2] | 8.5 % (512/6042) [7.8, 9.2] | 0.8 % (49/6042) [0.6, 1.1] | 0.5 % (31/6042) [0.4, 0.7] |

Role split (domains with an AI-specific block, per operator): OpenAI training 583, search 239, user 278 of 6042; Anthropic training 616, search 185, user 189 of 6042; Perplexity training 0, search 277, user 211 of 6042

### wave1-head-gh-azure

Vantage: gh-azure US AS8075 Microsoft Corporation
Funnel: listed 10000, opted out 0, robots.txt unreachable 2068, robots.txt disallows study 226, no website 157, probed 7549, comparable 5731.

Any AI agent (per domain):

- declaredFullBlock: 13.3 % (765/5731) [12.5, 14.3]
- servedBlocked: 16.8 % (964/5731) [15.9, 17.8]
- aiSpecificBlock: 13.9 % (796/5731) [13.0, 14.8]
- payment: 1.2 % (67/5731) [0.9, 1.5]
- aiSpecificDiff: 2.6 % (151/5731) [2.3, 3.1]
- enforcedDespiteAllowed: 11.1 % (636/5731) [10.3, 11.9]

RQ2 upper bound (no manual coding):

- anyAiDiff: 2.6 % (151/5731) [2.3, 3.1]
- anySearchEngineDiff: 2.6 % (147/5731) [2.2, 3.0]
- aiOnlyDiff: 1.2 % (66/5731) [0.9, 1.5]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.2 % (10/5731) [0.1, 0.3] | 5.1 % (293/5731) [4.6, 5.7] | 3.5 % (201/5731) [3.1, 4.0] | 0.1 % (5/5731) [0.0, 0.2] | 2.1 % (120/5731) [1.8, 2.5] |
| bingbot | reference | 0.2 % (13/5731) [0.1, 0.4] | 3.4 % (193/5731) [2.9, 3.9] | 2.5 % (143/5731) [2.1, 2.9] | 0.1 % (4/5731) [0.0, 0.2] | 2.2 % (124/5731) [1.8, 2.6] |
| gptbot | training | 10.6 % (606/5731) [9.8, 11.4] | 9.0 % (514/5731) [8.3, 9.7] | 7.7 % (441/5731) [7.0, 8.4] | 0.6 % (34/5731) [0.4, 0.8] | 1.4 % (79/5731) [1.1, 1.7] |
| oai-searchbot | search | 3.6 % (205/5731) [3.1, 4.1] | 3.7 % (211/5731) [3.2, 4.2] | 2.7 % (152/5731) [2.3, 3.1] | 0.7 % (38/5731) [0.5, 0.9] | 1.5 % (84/5731) [1.2, 1.8] |
| chatgpt-user | user | 4.9 % (282/5731) [4.4, 5.5] | 4.3 % (247/5731) [3.8, 4.9] | 3.4 % (193/5731) [2.9, 3.9] | 0.7 % (38/5731) [0.5, 0.9] | 1.4 % (81/5731) [1.1, 1.8] |
| claudebot | training | 9.2 % (530/5731) [8.5, 10.0] | 9.8 % (561/5731) [9.0, 10.6] | 8.4 % (483/5731) [7.7, 9.2] | 0.6 % (34/5731) [0.4, 0.8] | 1.2 % (67/5731) [0.9, 1.5] |
| claude-searchbot | search | 2.8 % (159/5731) [2.4, 3.2] | 2.4 % (136/5731) [2.0, 2.8] | 1.7 % (95/5731) [1.4, 2.0] | 0.4 % (25/5731) [0.3, 0.6] | 0.9 % (53/5731) [0.7, 1.2] |
| claude-user | user | 2.9 % (168/5731) [2.5, 3.4] | 2.4 % (135/5731) [2.0, 2.8] | 1.9 % (111/5731) [1.6, 2.3] | 0.4 % (22/5731) [0.3, 0.6] | 0.8 % (46/5731) [0.6, 1.1] |
| perplexitybot | search | 5.7 % (326/5731) [5.1, 6.3] | 5.6 % (321/5731) [5.0, 6.2] | 3.8 % (217/5731) [3.3, 4.3] | 0.7 % (41/5731) [0.5, 1.0] | 1.2 % (67/5731) [0.9, 1.5] |
| perplexity-user | user | 3.1 % (179/5731) [2.7, 3.6] | 4.1 % (235/5731) [3.6, 4.6] | 2.9 % (165/5731) [2.5, 3.3] | 0.7 % (39/5731) [0.5, 0.9] | 1.3 % (73/5731) [1.0, 1.6] |
| meta-externalagent | training | 8.0 % (456/5731) [7.3, 8.7] | 7.1 % (407/5731) [6.5, 7.8] | 5.3 % (301/5731) [4.7, 5.9] | 0.6 % (36/5731) [0.5, 0.9] | 1.0 % (59/5731) [0.8, 1.3] |
| ccbot | training | 10.8 % (620/5731) [10.0, 11.6] | 9.6 % (552/5731) [8.9, 10.4] | 7.5 % (430/5731) [6.8, 8.2] | 0.8 % (48/5731) [0.6, 1.1] | 0.7 % (41/5731) [0.5, 1.0] |

Role split (domains with an AI-specific block, per operator): OpenAI training 441, search 152, user 193 of 5731; Anthropic training 483, search 95, user 111 of 5731; Perplexity training 0, search 217, user 165 of 5731

### Agreement wave1-head-de-residential vs wave1-head-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 5523 | 174 | 11 | 20 | 0.92 | 94.1 % (174/185) [89.7, 96.6] |
| bingbot | 5523 | 130 | 65 | 4 | 0.78 | 66.7 % (130/195) [59.8, 72.9] |
| gptbot | 5523 | 396 | 69 | 21 | 0.89 | 85.2 % (396/465) [81.6, 88.1] |
| oai-searchbot | 5523 | 124 | 50 | 17 | 0.78 | 71.3 % (124/174) [64.1, 77.5] |
| chatgpt-user | 5523 | 162 | 54 | 21 | 0.81 | 75.0 % (162/216) [68.8, 80.3] |
| claudebot | 5523 | 439 | 69 | 20 | 0.90 | 86.4 % (439/508) [83.2, 89.1] |
| claude-searchbot | 5523 | 74 | 57 | 15 | 0.67 | 56.5 % (74/131) [47.9, 64.7] |
| claude-user | 5523 | 88 | 55 | 17 | 0.70 | 61.5 % (88/143) [53.4, 69.1] |
| perplexitybot | 5523 | 199 | 10 | 11 | 0.95 | 95.2 % (199/209) [91.4, 97.4] |
| perplexity-user | 5523 | 148 | 9 | 14 | 0.93 | 94.3 % (148/157) [89.5, 97.0] |
| meta-externalagent | 5523 | 265 | 12 | 21 | 0.94 | 95.7 % (265/277) [92.6, 97.5] |
| ccbot | 5523 | 388 | 15 | 21 | 0.95 | 96.3 % (388/403) [94.0, 97.7] |

### Validation with real agents (PROTOCOL.md §7b)

| Agent | checks | got content | refused/failed | unclear | not run | also blocked |
|---|---|---|---|---|---|---|
| ChatGPT | 40 | 20 | 14 | 1 | 5 | 41.2 % (14/34) [26.4, 57.8] |
| Claude | 40 | 29 | 5 | 2 | 4 | 14.7 % (5/34) [6.4, 30.1] |
| Perplexity | 14 | 10 | 1 | 3 | 0 | 9.1 % (1/11) [1.6, 37.7] |

## wave1-tail

Analysis generated 2026-10-29T13:51:14.377Z.

### wave1-tail-de-residential

Vantage: de-residential DE AS3320 Deutsche Telekom AG
Funnel: listed 5000, opted out 0, robots.txt unreachable 922, robots.txt disallows study 270, no website 39, probed 3768, comparable 3190.

Any AI agent (per domain):

- declaredFullBlock: 9.6 % (307/3190) [8.6, 10.7]
- servedBlocked: 21.8 % (697/3190) [20.4, 23.3]
- aiSpecificBlock: 19.4 % (619/3190) [18.1, 20.8]
- payment: 0.1 % (4/3190) [0.0, 0.3]
- aiSpecificDiff: 1.0 % (33/3190) [0.7, 1.4]
- enforcedDespiteAllowed: 15.3 % (489/3190) [14.1, 16.6]

RQ2 upper bound (no manual coding):

- anyAiDiff: 1.0 % (33/3190) [0.7, 1.4]
- anySearchEngineDiff: 1.5 % (48/3190) [1.1, 2.0]
- aiOnlyDiff: 0.5 % (15/3190) [0.3, 0.8]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.0 % (0/3190) [0.0, 0.1] | 3.6 % (116/3190) [3.0, 4.3] | 2.9 % (92/3190) [2.4, 3.5] | 0.0 % (0/3190) [0.0, 0.1] | 1.3 % (43/3190) [1.0, 1.8] |
| bingbot | reference | 0.3 % (9/3190) [0.1, 0.5] | 4.5 % (145/3190) [3.9, 5.3] | 3.5 % (113/3190) [3.0, 4.2] | 0.0 % (0/3190) [0.0, 0.1] | 1.0 % (32/3190) [0.7, 1.4] |
| gptbot | training | 8.1 % (258/3190) [7.2, 9.1] | 13.8 % (439/3190) [12.6, 15.0] | 12.2 % (390/3190) [11.1, 13.4] | 0.1 % (3/3190) [0.0, 0.3] | 0.4 % (13/3190) [0.2, 0.7] |
| oai-searchbot | search | 0.9 % (29/3190) [0.6, 1.3] | 4.4 % (139/3190) [3.7, 5.1] | 3.2 % (102/3190) [2.6, 3.9] | 0.1 % (3/3190) [0.0, 0.3] | 0.5 % (15/3190) [0.3, 0.8] |
| chatgpt-user | user | 1.8 % (59/3190) [1.4, 2.4] | 4.3 % (138/3190) [3.7, 5.1] | 3.4 % (107/3190) [2.8, 4.0] | 0.1 % (3/3190) [0.0, 0.3] | 0.4 % (13/3190) [0.2, 0.7] |
| claudebot | training | 7.1 % (228/3190) [6.3, 8.1] | 15.5 % (494/3190) [14.3, 16.8] | 14.1 % (449/3190) [12.9, 15.3] | 0.1 % (3/3190) [0.0, 0.3] | 0.4 % (14/3190) [0.3, 0.7] |
| claude-searchbot | search | 0.6 % (18/3190) [0.4, 0.9] | 3.2 % (101/3190) [2.6, 3.8] | 2.1 % (66/3190) [1.6, 2.6] | 0.1 % (2/3190) [0.0, 0.2] | 0.3 % (9/3190) [0.1, 0.5] |
| claude-user | user | 0.5 % (17/3190) [0.3, 0.9] | 2.5 % (79/3190) [2.0, 3.1] | 1.8 % (58/3190) [1.4, 2.3] | 0.1 % (2/3190) [0.0, 0.2] | 0.3 % (8/3190) [0.1, 0.5] |
| perplexitybot | search | 1.5 % (47/3190) [1.1, 2.0] | 4.6 % (148/3190) [4.0, 5.4] | 3.4 % (109/3190) [2.8, 4.1] | 0.1 % (3/3190) [0.0, 0.3] | 0.3 % (10/3190) [0.2, 0.6] |
| perplexity-user | user | 0.6 % (19/3190) [0.4, 0.9] | 2.4 % (78/3190) [2.0, 3.0] | 1.8 % (59/3190) [1.4, 2.4] | 0.1 % (3/3190) [0.0, 0.3] | 0.3 % (9/3190) [0.1, 0.5] |
| meta-externalagent | training | 6.9 % (220/3190) [6.1, 7.8] | 8.1 % (257/3190) [7.2, 9.1] | 6.8 % (217/3190) [6.0, 7.7] | 0.1 % (3/3190) [0.0, 0.3] | 0.4 % (13/3190) [0.2, 0.7] |
| ccbot | training | 7.8 % (250/3190) [7.0, 8.8] | 12.8 % (408/3190) [11.7, 14.0] | 11.3 % (360/3190) [10.2, 12.4] | 0.1 % (4/3190) [0.0, 0.3] | 0.3 % (9/3190) [0.1, 0.5] |

Role split (domains with an AI-specific block, per operator): OpenAI training 390, search 102, user 107 of 3190; Anthropic training 449, search 66, user 58 of 3190; Perplexity training 0, search 109, user 59 of 3190

### wave1-tail-gh-azure

Vantage: gh-azure US AS8075 Microsoft Corporation
Funnel: listed 5000, opted out 0, robots.txt unreachable 970, robots.txt disallows study 267, no website 66, probed 3696, comparable 3007.

Any AI agent (per domain):

- declaredFullBlock: 8.6 % (258/3007) [7.6, 9.6]
- servedBlocked: 19.6 % (590/3007) [18.2, 21.1]
- aiSpecificBlock: 17.6 % (530/3007) [16.3, 19.0]
- payment: 0.2 % (5/3007) [0.1, 0.4]
- aiSpecificDiff: 1.1 % (33/3007) [0.8, 1.5]
- enforcedDespiteAllowed: 13.9 % (419/3007) [12.7, 15.2]

RQ2 upper bound (no manual coding):

- anyAiDiff: 1.1 % (33/3007) [0.8, 1.5]
- anySearchEngineDiff: 1.5 % (45/3007) [1.1, 2.0]
- aiOnlyDiff: 0.7 % (20/3007) [0.4, 1.0]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.0 % (0/3007) [0.0, 0.1] | 3.3 % (98/3007) [2.7, 4.0] | 2.5 % (76/3007) [2.0, 3.2] | 0.1 % (2/3007) [0.0, 0.2] | 1.3 % (39/3007) [1.0, 1.8] |
| bingbot | reference | 0.3 % (8/3007) [0.1, 0.5] | 2.8 % (83/3007) [2.2, 3.4] | 2.3 % (68/3007) [1.8, 2.9] | 0.1 % (2/3007) [0.0, 0.2] | 1.0 % (31/3007) [0.7, 1.5] |
| gptbot | training | 7.3 % (220/3007) [6.4, 8.3] | 11.6 % (349/3007) [10.5, 12.8] | 10.3 % (311/3007) [9.3, 11.5] | 0.1 % (4/3007) [0.1, 0.3] | 0.5 % (16/3007) [0.3, 0.9] |
| oai-searchbot | search | 1.0 % (30/3007) [0.7, 1.4] | 3.4 % (101/3007) [2.8, 4.1] | 2.4 % (73/3007) [1.9, 3.0] | 0.1 % (4/3007) [0.1, 0.3] | 0.5 % (16/3007) [0.3, 0.9] |
| chatgpt-user | user | 1.9 % (57/3007) [1.5, 2.4] | 3.4 % (103/3007) [2.8, 4.1] | 2.6 % (79/3007) [2.1, 3.3] | 0.1 % (4/3007) [0.1, 0.3] | 0.6 % (18/3007) [0.4, 0.9] |
| claudebot | training | 6.3 % (189/3007) [5.5, 7.2] | 13.2 % (398/3007) [12.1, 14.5] | 11.9 % (358/3007) [10.8, 13.1] | 0.1 % (4/3007) [0.1, 0.3] | 0.5 % (16/3007) [0.3, 0.9] |
| claude-searchbot | search | 0.6 % (19/3007) [0.4, 1.0] | 1.7 % (52/3007) [1.3, 2.3] | 1.0 % (31/3007) [0.7, 1.5] | 0.1 % (3/3007) [0.0, 0.3] | 0.4 % (12/3007) [0.2, 0.7] |
| claude-user | user | 0.4 % (13/3007) [0.3, 0.7] | 1.4 % (43/3007) [1.1, 1.9] | 1.0 % (31/3007) [0.7, 1.5] | 0.1 % (3/3007) [0.0, 0.3] | 0.3 % (10/3007) [0.2, 0.6] |
| perplexitybot | search | 1.6 % (47/3007) [1.2, 2.1] | 4.0 % (121/3007) [3.4, 4.8] | 2.9 % (88/3007) [2.4, 3.6] | 0.1 % (4/3007) [0.1, 0.3] | 0.3 % (8/3007) [0.1, 0.5] |
| perplexity-user | user | 0.6 % (18/3007) [0.4, 0.9] | 2.0 % (61/3007) [1.6, 2.6] | 1.6 % (47/3007) [1.2, 2.1] | 0.1 % (4/3007) [0.1, 0.3] | 0.1 % (4/3007) [0.1, 0.3] |
| meta-externalagent | training | 5.9 % (176/3007) [5.1, 6.7] | 7.4 % (224/3007) [6.6, 8.4] | 6.1 % (184/3007) [5.3, 7.0] | 0.1 % (3/3007) [0.0, 0.3] | 0.3 % (9/3007) [0.2, 0.6] |
| ccbot | training | 6.9 % (206/3007) [6.0, 7.8] | 11.0 % (332/3007) [10.0, 12.2] | 9.7 % (291/3007) [8.7, 10.8] | 0.2 % (5/3007) [0.1, 0.4] | 0.1 % (4/3007) [0.1, 0.3] |

Role split (domains with an AI-specific block, per operator): OpenAI training 311, search 73, user 79 of 3007; Anthropic training 358, search 31, user 31 of 3007; Perplexity training 0, search 88, user 47 of 3007

### Agreement wave1-tail-de-residential vs wave1-tail-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 2900 | 72 | 1 | 3 | 0.97 | 98.6 % (72/73) [92.6, 99.8] |
| bingbot | 2900 | 61 | 29 | 4 | 0.78 | 67.8 % (61/90) [57.6, 76.5] |
| gptbot | 2900 | 290 | 12 | 3 | 0.97 | 96.0 % (290/302) [93.2, 97.7] |
| oai-searchbot | 2900 | 65 | 8 | 2 | 0.93 | 89.0 % (65/73) [79.8, 94.3] |
| chatgpt-user | 2900 | 73 | 10 | 1 | 0.93 | 88.0 % (73/83) [79.2, 93.3] |
| claudebot | 2900 | 339 | 14 | 4 | 0.97 | 96.0 % (339/353) [93.5, 97.6] |
| claude-searchbot | 2900 | 29 | 10 | 1 | 0.84 | 74.4 % (29/39) [58.9, 85.4] |
| claude-user | 2900 | 30 | 8 | 1 | 0.87 | 78.9 % (30/38) [63.7, 88.9] |
| perplexitybot | 2900 | 78 | 2 | 4 | 0.96 | 97.5 % (78/80) [91.3, 99.3] |
| perplexity-user | 2900 | 41 | 1 | 3 | 0.95 | 97.6 % (41/42) [87.7, 99.6] |
| meta-externalagent | 2900 | 172 | 3 | 4 | 0.98 | 98.3 % (172/175) [95.1, 99.4] |
| ccbot | 2900 | 271 | 3 | 3 | 0.99 | 98.9 % (271/274) [96.8, 99.6] |

## wave1v2-head-de-residential

Analysis generated 2026-10-29T15:43:50.045Z.

**Repeatability, wave 1 vs wave 2 at one vantage point, on the wave-2 domains only (PROTOCOL.md §9: one day apart). "repeated" = share of wave-1 AI-specific blocks seen again in wave 2. κ is computed on flagged domains, so it is not a population κ.** Per-run shares of wave 1 are in the wave1-* sections.

### Agreement wave1-head-de-residential vs wave2-head-de-residential (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 1769 | 227 | 6 | 5 | 0.97 | 97.4 % (227/233) [94.5, 98.8] |
| bingbot | 1769 | 235 | 4 | 4 | 0.98 | 98.3 % (235/239) [95.8, 99.3] |
| gptbot | 1769 | 560 | 16 | 2 | 0.98 | 97.2 % (560/576) [95.5, 98.3] |
| oai-searchbot | 1769 | 235 | 1 | 3 | 0.99 | 99.6 % (235/236) [97.6, 99.9] |
| chatgpt-user | 1769 | 270 | 3 | 1 | 0.99 | 98.9 % (270/273) [96.8, 99.6] |
| claudebot | 1769 | 590 | 15 | 3 | 0.98 | 97.5 % (590/605) [95.9, 98.5] |
| claude-searchbot | 1769 | 177 | 3 | 1 | 0.99 | 98.3 % (177/180) [95.2, 99.4] |
| claude-user | 1769 | 184 | 3 | 2 | 0.99 | 98.4 % (184/187) [95.4, 99.5] |
| perplexitybot | 1769 | 266 | 4 | 4 | 0.98 | 98.5 % (266/270) [96.3, 99.4] |
| perplexity-user | 1769 | 206 | 1 | 2 | 0.99 | 99.5 % (206/207) [97.3, 99.9] |
| meta-externalagent | 1769 | 336 | 2 | 4 | 0.99 | 99.4 % (336/338) [97.9, 99.8] |
| ccbot | 1769 | 496 | 9 | 3 | 0.98 | 98.2 % (496/505) [96.6, 99.1] |

## wave1v2-head-gh-azure

Analysis generated 2026-10-29T15:43:59.281Z.

**Repeatability, wave 1 vs wave 2 at one vantage point, on the wave-2 domains only (PROTOCOL.md §9: one day apart). "repeated" = share of wave-1 AI-specific blocks seen again in wave 2. κ is computed on flagged domains, so it is not a population κ.** Per-run shares of wave 1 are in the wave1-* sections.

### Agreement wave1-head-gh-azure vs wave2-head-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 1540 | 197 | 0 | 5 | 0.99 | 100.0 % (197/197) [98.1, 100.0] |
| bingbot | 1540 | 138 | 3 | 4 | 0.97 | 97.9 % (138/141) [93.9, 99.3] |
| gptbot | 1540 | 412 | 13 | 3 | 0.97 | 96.9 % (412/425) [94.8, 98.2] |
| oai-searchbot | 1540 | 147 | 3 | 0 | 0.99 | 98.0 % (147/150) [94.3, 99.3] |
| chatgpt-user | 1540 | 186 | 3 | 2 | 0.98 | 98.4 % (186/189) [95.4, 99.5] |
| claudebot | 1540 | 456 | 14 | 2 | 0.98 | 97.0 % (456/470) [95.1, 98.2] |
| claude-searchbot | 1540 | 90 | 4 | 2 | 0.97 | 95.7 % (90/94) [89.6, 98.3] |
| claude-user | 1540 | 109 | 1 | 1 | 0.99 | 99.1 % (109/110) [95.0, 99.8] |
| perplexitybot | 1540 | 205 | 6 | 2 | 0.98 | 97.2 % (205/211) [93.9, 98.7] |
| perplexity-user | 1540 | 161 | 2 | 1 | 0.99 | 98.8 % (161/163) [95.6, 99.7] |
| meta-externalagent | 1540 | 293 | 5 | 1 | 0.99 | 98.3 % (293/298) [96.1, 99.3] |
| ccbot | 1540 | 403 | 15 | 3 | 0.97 | 96.4 % (403/418) [94.2, 97.8] |

## wave1v2-tail-de-residential

Analysis generated 2026-10-29T15:44:04.346Z.

**Repeatability, wave 1 vs wave 2 at one vantage point, on the wave-2 domains only (PROTOCOL.md §9: one day apart). "repeated" = share of wave-1 AI-specific blocks seen again in wave 2. κ is computed on flagged domains, so it is not a population κ.** Per-run shares of wave 1 are in the wave1-* sections.

### Agreement wave1-tail-de-residential vs wave2-tail-de-residential (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 831 | 91 | 1 | 2 | 0.98 | 98.9 % (91/92) [94.1, 99.8] |
| bingbot | 831 | 110 | 3 | 6 | 0.95 | 97.3 % (110/113) [92.5, 99.1] |
| gptbot | 831 | 380 | 6 | 4 | 0.98 | 98.4 % (380/386) [96.7, 99.3] |
| oai-searchbot | 831 | 99 | 1 | 2 | 0.98 | 99.0 % (99/100) [94.6, 99.8] |
| chatgpt-user | 831 | 104 | 1 | 2 | 0.98 | 99.0 % (104/105) [94.8, 99.8] |
| claudebot | 831 | 437 | 8 | 4 | 0.97 | 98.2 % (437/445) [96.5, 99.1] |
| claude-searchbot | 831 | 66 | 0 | 3 | 0.98 | 100.0 % (66/66) [94.5, 100.0] |
| claude-user | 831 | 57 | 1 | 0 | 0.99 | 98.3 % (57/58) [90.9, 99.7] |
| perplexitybot | 831 | 107 | 1 | 2 | 0.98 | 99.1 % (107/108) [94.9, 99.8] |
| perplexity-user | 831 | 58 | 0 | 1 | 0.99 | 100.0 % (58/58) [93.8, 100.0] |
| meta-externalagent | 831 | 210 | 3 | 2 | 0.98 | 98.6 % (210/213) [95.9, 99.5] |
| ccbot | 831 | 357 | 2 | 2 | 0.99 | 99.4 % (357/359) [98.0, 99.8] |

## wave1v2-tail-gh-azure

Analysis generated 2026-10-29T15:44:07.183Z.

**Repeatability, wave 1 vs wave 2 at one vantage point, on the wave-2 domains only (PROTOCOL.md §9: one day apart). "repeated" = share of wave-1 AI-specific blocks seen again in wave 2. κ is computed on flagged domains, so it is not a population κ.** Per-run shares of wave 1 are in the wave1-* sections.

### Agreement wave1-tail-gh-azure vs wave2-tail-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 699 | 75 | 0 | 1 | 0.99 | 100.0 % (75/75) [95.1, 100.0] |
| bingbot | 699 | 65 | 1 | 1 | 0.98 | 98.5 % (65/66) [91.9, 99.7] |
| gptbot | 699 | 293 | 5 | 4 | 0.97 | 98.3 % (293/298) [96.1, 99.3] |
| oai-searchbot | 699 | 69 | 1 | 0 | 0.99 | 98.6 % (69/70) [92.3, 99.7] |
| chatgpt-user | 699 | 74 | 0 | 1 | 0.99 | 100.0 % (74/74) [95.1, 100.0] |
| claudebot | 699 | 341 | 6 | 3 | 0.97 | 98.3 % (341/347) [96.3, 99.2] |
| claude-searchbot | 699 | 30 | 0 | 1 | 0.98 | 100.0 % (30/30) [88.6, 100.0] |
| claude-user | 699 | 30 | 0 | 1 | 0.98 | 100.0 % (30/30) [88.6, 100.0] |
| perplexitybot | 699 | 83 | 1 | 2 | 0.98 | 98.8 % (83/84) [93.6, 99.8] |
| perplexity-user | 699 | 43 | 0 | 0 | 1.00 | 100.0 % (43/43) [91.8, 100.0] |
| meta-externalagent | 699 | 177 | 4 | 3 | 0.97 | 97.8 % (177/181) [94.5, 99.1] |
| ccbot | 699 | 280 | 2 | 1 | 0.99 | 99.3 % (280/282) [97.5, 99.8] |

## wave2-head

Analysis generated 2026-10-29T15:43:42.143Z.

**Wave 2 measured only the domains flagged in wave 1 (config/wave2-*.txt), so its shares are of flagged domains, not of the population; compare them with wave 1 only through the wave1v2 sections.**

### wave2-head-de-residential

Vantage: de-residential DE AS3320 Deutsche Telekom AG
Funnel: listed 1876, opted out 0, robots.txt unreachable 15, robots.txt disallows study 0, no website 15, probed 1846, comparable 1775.

Any AI agent (per domain):

- declaredFullBlock: 26.0 % (462/1775) [24.0, 28.1]
- servedBlocked: 64.9 % (1152/1775) [62.7, 67.1]
- aiSpecificBlock: 49.7 % (883/1775) [47.4, 52.1]
- payment: 3.7 % (66/1775) [2.9, 4.7]
- aiSpecificDiff: 6.4 % (113/1775) [5.3, 7.6]
- enforcedDespiteAllowed: 38.9 % (691/1775) [36.7, 41.2]

RQ2 upper bound (no manual coding):

- anyAiDiff: 6.4 % (113/1775) [5.3, 7.6]
- anySearchEngineDiff: 6.6 % (118/1775) [5.6, 7.9]
- aiOnlyDiff: 2.9 % (52/1775) [2.2, 3.8]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.2 % (3/1775) [0.1, 0.5] | 21.0 % (372/1775) [19.1, 22.9] | 13.1 % (233/1775) [11.6, 14.8] | 0.1 % (1/1775) [0.0, 0.3] | 6.3 % (111/1775) [5.2, 7.5] |
| bingbot | reference | 0.1 % (1/1775) [0.0, 0.3] | 21.0 % (372/1775) [19.1, 22.9] | 13.5 % (239/1775) [12.0, 15.1] | 0.1 % (1/1775) [0.0, 0.3] | 5.5 % (98/1775) [4.6, 6.7] |
| gptbot | training | 20.7 % (368/1775) [18.9, 22.7] | 40.2 % (713/1775) [37.9, 42.5] | 31.8 % (565/1775) [29.7, 34.0] | 1.9 % (34/1775) [1.4, 2.7] | 3.4 % (60/1775) [2.6, 4.3] |
| oai-searchbot | search | 7.3 % (130/1775) [6.2, 8.6] | 21.9 % (388/1775) [20.0, 23.8] | 13.4 % (238/1775) [11.9, 15.1] | 2.1 % (38/1775) [1.6, 2.9] | 3.4 % (61/1775) [2.7, 4.4] |
| chatgpt-user | user | 9.7 % (172/1775) [8.4, 11.2] | 22.6 % (401/1775) [20.7, 24.6] | 15.3 % (271/1775) [13.7, 17.0] | 2.2 % (39/1775) [1.6, 3.0] | 3.4 % (60/1775) [2.6, 4.3] |
| claudebot | training | 19.2 % (341/1775) [17.4, 21.1] | 42.5 % (754/1775) [40.2, 44.8] | 33.6 % (596/1775) [31.4, 35.8] | 1.9 % (34/1775) [1.4, 2.7] | 3.0 % (54/1775) [2.3, 3.9] |
| claude-searchbot | search | 5.2 % (93/1775) [4.3, 6.4] | 16.1 % (286/1775) [14.5, 17.9] | 10.0 % (178/1775) [8.7, 11.5] | 1.5 % (26/1775) [1.0, 2.1] | 2.4 % (43/1775) [1.8, 3.2] |
| claude-user | user | 6.1 % (109/1775) [5.1, 7.4] | 15.1 % (268/1775) [13.5, 16.8] | 10.5 % (186/1775) [9.1, 12.0] | 1.2 % (22/1775) [0.8, 1.9] | 2.1 % (38/1775) [1.6, 2.9] |
| perplexitybot | search | 10.7 % (190/1775) [9.3, 12.2] | 23.3 % (414/1775) [21.4, 25.3] | 15.3 % (271/1775) [13.7, 17.0] | 2.3 % (41/1775) [1.7, 3.1] | 3.4 % (61/1775) [2.7, 4.4] |
| perplexity-user | user | 6.0 % (107/1775) [5.0, 7.2] | 17.3 % (307/1775) [15.6, 19.1] | 11.7 % (208/1775) [10.3, 13.3] | 2.2 % (39/1775) [1.6, 3.0] | 3.4 % (60/1775) [2.6, 4.3] |
| meta-externalagent | training | 16.7 % (297/1775) [15.1, 18.5] | 27.9 % (495/1775) [25.9, 30.0] | 19.2 % (340/1775) [17.4, 21.1] | 2.0 % (36/1775) [1.5, 2.8] | 2.9 % (51/1775) [2.2, 3.8] |
| ccbot | training | 22.0 % (390/1775) [20.1, 24.0] | 37.7 % (669/1775) [35.5, 40.0] | 28.2 % (500/1775) [26.1, 30.3] | 2.8 % (49/1775) [2.1, 3.6] | 1.5 % (27/1775) [1.0, 2.2] |

Role split (domains with an AI-specific block, per operator): OpenAI training 565, search 238, user 271 of 1775; Anthropic training 596, search 178, user 186 of 1775; Perplexity training 0, search 271, user 208 of 1775

### wave2-head-gh-azure

Vantage: gh-azure US AS8075 Microsoft Corporation
Funnel: listed 1876, opted out 0, robots.txt unreachable 9, robots.txt disallows study 2, no website 26, probed 1839, comparable 1550.

Any AI agent (per domain):

- declaredFullBlock: 26.5 % (410/1550) [24.3, 28.7]
- servedBlocked: 60.6 % (940/1550) [58.2, 63.0]
- aiSpecificBlock: 49.4 % (765/1550) [46.9, 51.8]
- payment: 4.3 % (67/1550) [3.4, 5.5]
- aiSpecificDiff: 9.5 % (147/1550) [8.1, 11.0]
- enforcedDespiteAllowed: 38.6 % (599/1550) [36.3, 41.1]

RQ2 upper bound (no manual coding):

- anyAiDiff: 9.5 % (147/1550) [8.1, 11.0]
- anySearchEngineDiff: 9.4 % (146/1550) [8.1, 11.0]
- aiOnlyDiff: 3.8 % (59/1550) [3.0, 4.9]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.3 % (4/1550) [0.1, 0.7] | 19.1 % (296/1550) [17.2, 21.1] | 13.0 % (202/1550) [11.4, 14.8] | 0.3 % (5/1550) [0.1, 0.8] | 7.9 % (123/1550) [6.7, 9.4] |
| bingbot | reference | 0.1 % (1/1550) [0.0, 0.4] | 12.4 % (192/1550) [10.8, 14.1] | 9.2 % (143/1550) [7.9, 10.8] | 0.3 % (4/1550) [0.1, 0.7] | 7.9 % (123/1550) [6.7, 9.4] |
| gptbot | training | 21.0 % (325/1550) [19.0, 23.1] | 31.9 % (494/1550) [29.6, 34.2] | 26.9 % (417/1550) [24.8, 29.2] | 2.2 % (34/1550) [1.6, 3.0] | 5.2 % (80/1550) [4.2, 6.4] |
| oai-searchbot | search | 8.1 % (125/1550) [6.8, 9.5] | 13.7 % (212/1550) [12.1, 15.5] | 9.6 % (149/1550) [8.2, 11.2] | 2.5 % (38/1550) [1.8, 3.3] | 5.5 % (85/1550) [4.5, 6.7] |
| chatgpt-user | user | 10.5 % (163/1550) [9.1, 12.1] | 15.9 % (247/1550) [14.2, 17.8] | 12.1 % (188/1550) [10.6, 13.8] | 2.5 % (38/1550) [1.8, 3.3] | 5.3 % (82/1550) [4.3, 6.5] |
| claudebot | training | 19.8 % (307/1550) [17.9, 21.9] | 35.0 % (543/1550) [32.7, 37.4] | 29.8 % (462/1550) [27.6, 32.1] | 2.2 % (34/1550) [1.6, 3.0] | 4.5 % (69/1550) [3.5, 5.6] |
| claude-searchbot | search | 5.8 % (90/1550) [4.7, 7.1] | 8.9 % (138/1550) [7.6, 10.4] | 6.1 % (94/1550) [5.0, 7.4] | 1.6 % (25/1550) [1.1, 2.4] | 3.2 % (50/1550) [2.5, 4.2] |
| claude-user | user | 6.8 % (106/1550) [5.7, 8.2] | 8.8 % (136/1550) [7.5, 10.3] | 7.2 % (111/1550) [6.0, 8.6] | 1.4 % (22/1550) [0.9, 2.1] | 3.0 % (46/1550) [2.2, 3.9] |
| perplexitybot | search | 11.7 % (182/1550) [10.2, 13.4] | 20.6 % (319/1550) [18.6, 22.7] | 13.5 % (210/1550) [11.9, 15.3] | 2.6 % (41/1550) [2.0, 3.6] | 4.1 % (63/1550) [3.2, 5.2] |
| perplexity-user | user | 6.9 % (107/1550) [5.7, 8.3] | 15.0 % (232/1550) [13.3, 16.8] | 10.5 % (163/1550) [9.1, 12.1] | 2.5 % (39/1550) [1.8, 3.4] | 4.6 % (71/1550) [3.6, 5.7] |
| meta-externalagent | training | 17.2 % (267/1550) [15.4, 19.2] | 26.3 % (407/1550) [24.1, 28.5] | 19.1 % (296/1550) [17.2, 21.1] | 2.3 % (36/1550) [1.7, 3.2] | 3.7 % (57/1550) [2.8, 4.7] |
| ccbot | training | 22.3 % (346/1550) [20.3, 24.5] | 34.5 % (534/1550) [32.1, 36.9] | 26.3 % (407/1550) [24.1, 28.5] | 3.1 % (48/1550) [2.3, 4.1] | 2.8 % (43/1550) [2.1, 3.7] |

Role split (domains with an AI-specific block, per operator): OpenAI training 417, search 149, user 188 of 1550; Anthropic training 462, search 94, user 111 of 1550; Perplexity training 0, search 210, user 163 of 1550

### Agreement wave2-head-de-residential vs wave2-head-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 1470 | 171 | 9 | 23 | 0.90 | 95.0 % (171/180) [90.8, 97.3] |
| bingbot | 1470 | 128 | 63 | 4 | 0.77 | 67.0 % (128/191) [60.1, 73.3] |
| gptbot | 1470 | 375 | 68 | 21 | 0.85 | 84.7 % (375/443) [81.0, 87.7] |
| oai-searchbot | 1470 | 121 | 53 | 17 | 0.75 | 69.5 % (121/174) [62.3, 75.9] |
| chatgpt-user | 1470 | 156 | 55 | 22 | 0.77 | 73.9 % (156/211) [67.6, 79.4] |
| claudebot | 1470 | 419 | 66 | 18 | 0.87 | 86.4 % (419/485) [83.1, 89.2] |
| claude-searchbot | 1470 | 70 | 59 | 16 | 0.62 | 54.3 % (70/129) [45.7, 62.6] |
| claude-user | 1470 | 87 | 55 | 18 | 0.68 | 61.3 % (87/142) [53.1, 68.9] |
| perplexitybot | 1470 | 193 | 12 | 10 | 0.94 | 94.1 % (193/205) [90.0, 96.6] |
| perplexity-user | 1470 | 146 | 9 | 14 | 0.92 | 94.2 % (146/155) [89.3, 96.9] |
| meta-externalagent | 1470 | 260 | 16 | 19 | 0.92 | 94.2 % (260/276) [90.8, 96.4] |
| ccbot | 1470 | 365 | 20 | 20 | 0.93 | 94.8 % (365/385) [92.1, 96.6] |

## wave2-tail

Analysis generated 2026-10-29T15:44:01.831Z.

**Wave 2 measured only the domains flagged in wave 1 (config/wave2-*.txt), so its shares are of flagged domains, not of the population; compare them with wave 1 only through the wave1v2 sections.**

### wave2-tail-de-residential

Vantage: de-residential DE AS3320 Deutsche Telekom AG
Funnel: listed 880, opted out 0, robots.txt unreachable 8, robots.txt disallows study 0, no website 1, probed 871, comparable 840.

Any AI agent (per domain):

- declaredFullBlock: 26.7 % (224/840) [23.8, 29.8]
- servedBlocked: 82.6 % (694/840) [79.9, 85.0]
- aiSpecificBlock: 73.8 % (620/840) [70.7, 76.7]
- payment: 0.5 % (4/840) [0.2, 1.2]
- aiSpecificDiff: 3.5 % (29/840) [2.4, 4.9]
- enforcedDespiteAllowed: 56.3 % (473/840) [52.9, 59.6]

RQ2 upper bound (no manual coding):

- anyAiDiff: 3.5 % (29/840) [2.4, 4.9]
- anySearchEngineDiff: 5.2 % (44/840) [3.9, 7.0]
- aiOnlyDiff: 1.7 % (14/840) [1.0, 2.8]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.0 % (0/840) [0.0, 0.5] | 14.2 % (119/840) [12.0, 16.7] | 11.2 % (94/840) [9.2, 13.5] | 0.0 % (0/840) [0.0, 0.5] | 4.6 % (39/840) [3.4, 6.3] |
| bingbot | reference | 0.5 % (4/840) [0.2, 1.2] | 17.4 % (146/840) [15.0, 20.1] | 14.0 % (118/840) [11.9, 16.6] | 0.0 % (0/840) [0.0, 0.5] | 3.7 % (31/840) [2.6, 5.2] |
| gptbot | training | 24.3 % (204/840) [21.5, 27.3] | 51.7 % (434/840) [48.3, 55.0] | 46.2 % (388/840) [42.8, 49.6] | 0.4 % (3/840) [0.1, 1.0] | 1.4 % (12/840) [0.8, 2.5] |
| oai-searchbot | search | 2.1 % (18/840) [1.4, 3.4] | 16.3 % (137/840) [14.0, 19.0] | 12.1 % (102/840) [10.1, 14.5] | 0.4 % (3/840) [0.1, 1.0] | 1.4 % (12/840) [0.8, 2.5] |
| chatgpt-user | user | 3.1 % (26/840) [2.1, 4.5] | 16.3 % (137/840) [14.0, 19.0] | 12.7 % (107/840) [10.7, 15.2] | 0.4 % (3/840) [0.1, 1.0] | 1.4 % (12/840) [0.8, 2.5] |
| claudebot | training | 22.9 % (192/840) [20.1, 25.8] | 58.1 % (488/840) [54.7, 61.4] | 53.0 % (445/840) [49.6, 56.3] | 0.4 % (3/840) [0.1, 1.0] | 1.4 % (12/840) [0.8, 2.5] |
| claude-searchbot | search | 1.4 % (12/840) [0.8, 2.5] | 12.0 % (101/840) [10.0, 14.4] | 8.2 % (69/840) [6.5, 10.3] | 0.2 % (2/840) [0.1, 0.9] | 1.0 % (8/840) [0.5, 1.9] |
| claude-user | user | 1.5 % (13/840) [0.9, 2.6] | 9.0 % (76/840) [7.3, 11.2] | 6.8 % (57/840) [5.3, 8.7] | 0.2 % (2/840) [0.1, 0.9] | 1.0 % (8/840) [0.5, 1.9] |
| perplexitybot | search | 2.6 % (22/840) [1.7, 3.9] | 17.9 % (150/840) [15.4, 20.6] | 13.2 % (111/840) [11.1, 15.7] | 0.4 % (3/840) [0.1, 1.0] | 1.2 % (10/840) [0.6, 2.2] |
| perplexity-user | user | 1.9 % (16/840) [1.2, 3.1] | 9.4 % (79/840) [7.6, 11.6] | 7.1 % (60/840) [5.6, 9.1] | 0.4 % (3/840) [0.1, 1.0] | 0.8 % (7/840) [0.4, 1.7] |
| meta-externalagent | training | 23.2 % (195/840) [20.5, 26.2] | 30.6 % (257/840) [27.6, 33.8] | 25.8 % (217/840) [23.0, 28.9] | 0.4 % (3/840) [0.1, 1.0] | 1.2 % (10/840) [0.6, 2.2] |
| ccbot | training | 23.5 % (197/840) [20.7, 26.4] | 48.9 % (411/840) [45.6, 52.3] | 43.2 % (363/840) [39.9, 46.6] | 0.5 % (4/840) [0.2, 1.2] | 0.7 % (6/840) [0.3, 1.5] |

Role split (domains with an AI-specific block, per operator): OpenAI training 388, search 102, user 107 of 840; Anthropic training 445, search 69, user 57 of 840; Perplexity training 0, search 111, user 60 of 840

### wave2-tail-gh-azure

Vantage: gh-azure US AS8075 Microsoft Corporation
Funnel: listed 880, opted out 0, robots.txt unreachable 14, robots.txt disallows study 1, no website 4, probed 861, comparable 714.

Any AI agent (per domain):

- declaredFullBlock: 24.1 % (172/714) [21.1, 27.4]
- servedBlocked: 80.8 % (577/714) [77.8, 83.5]
- aiSpecificBlock: 73.1 % (522/714) [69.7, 76.2]
- payment: 0.7 % (5/714) [0.3, 1.6]
- aiSpecificDiff: 3.9 % (28/714) [2.7, 5.6]
- enforcedDespiteAllowed: 56.4 % (403/714) [52.8, 60.0]

RQ2 upper bound (no manual coding):

- anyAiDiff: 3.9 % (28/714) [2.7, 5.6]
- anySearchEngineDiff: 5.5 % (39/714) [4.0, 7.4]
- aiOnlyDiff: 2.4 % (17/714) [1.5, 3.8]

| Agent | role | declared full block | served block | AI-specific block | 402 | AI-specific content diff |
|---|---|---|---|---|---|---|
| googlebot | reference | 0.0 % (0/714) [0.0, 0.5] | 13.9 % (99/714) [11.5, 16.6] | 11.1 % (79/714) [9.0, 13.6] | 0.3 % (2/714) [0.1, 1.0] | 4.8 % (34/714) [3.4, 6.6] |
| bingbot | reference | 0.4 % (3/714) [0.1, 1.2] | 11.8 % (84/714) [9.6, 14.3] | 9.7 % (69/714) [7.7, 12.1] | 0.3 % (2/714) [0.1, 1.0] | 3.9 % (28/714) [2.7, 5.6] |
| gptbot | training | 21.8 % (156/714) [19.0, 25.0] | 47.2 % (337/714) [43.6, 50.9] | 42.6 % (304/714) [39.0, 46.2] | 0.6 % (4/714) [0.2, 1.4] | 2.1 % (15/714) [1.3, 3.4] |
| oai-searchbot | search | 2.2 % (16/714) [1.4, 3.6] | 13.4 % (96/714) [11.1, 16.1] | 10.1 % (72/714) [8.1, 12.5] | 0.6 % (4/714) [0.2, 1.4] | 2.1 % (15/714) [1.3, 3.4] |
| chatgpt-user | user | 2.9 % (21/714) [1.9, 4.5] | 14.0 % (100/714) [11.7, 16.7] | 10.8 % (77/714) [8.7, 13.3] | 0.6 % (4/714) [0.2, 1.4] | 2.1 % (15/714) [1.3, 3.4] |
| claudebot | training | 20.6 % (147/714) [17.8, 23.7] | 54.2 % (387/714) [50.5, 57.8] | 49.4 % (353/714) [45.8, 53.1] | 0.6 % (4/714) [0.2, 1.4] | 2.2 % (16/714) [1.4, 3.6] |
| claude-searchbot | search | 1.8 % (13/714) [1.1, 3.1] | 7.0 % (50/714) [5.4, 9.1] | 4.3 % (31/714) [3.1, 6.1] | 0.4 % (3/714) [0.1, 1.2] | 1.4 % (10/714) [0.8, 2.6] |
| claude-user | user | 1.4 % (10/714) [0.8, 2.6] | 5.7 % (41/714) [4.3, 7.7] | 4.3 % (31/714) [3.1, 6.1] | 0.4 % (3/714) [0.1, 1.2] | 1.4 % (10/714) [0.8, 2.6] |
| perplexitybot | search | 2.8 % (20/714) [1.8, 4.3] | 16.1 % (115/714) [13.6, 19.0] | 12.0 % (86/714) [9.9, 14.6] | 0.6 % (4/714) [0.2, 1.4] | 1.0 % (7/714) [0.5, 2.0] |
| perplexity-user | user | 1.8 % (13/714) [1.1, 3.1] | 7.8 % (56/714) [6.1, 10.0] | 6.2 % (44/714) [4.6, 8.2] | 0.6 % (4/714) [0.2, 1.4] | 0.6 % (4/714) [0.2, 1.4] |
| meta-externalagent | training | 20.6 % (147/714) [17.8, 23.7] | 30.5 % (218/714) [27.3, 34.0] | 25.6 % (183/714) [22.6, 29.0] | 0.4 % (3/714) [0.1, 1.2] | 1.3 % (9/714) [0.7, 2.4] |
| ccbot | training | 21.0 % (150/714) [18.2, 24.1] | 45.8 % (327/714) [42.2, 49.5] | 40.3 % (288/714) [36.8, 44.0] | 0.7 % (5/714) [0.3, 1.6] | 0.6 % (4/714) [0.2, 1.4] |

Role split (domains with an AI-specific block, per operator): OpenAI training 304, search 72, user 77 of 714; Anthropic training 353, search 31, user 31 of 714; Perplexity training 0, search 86, user 44 of 714

### Agreement wave2-tail-de-residential vs wave2-tail-gh-azure (AI-specific block)

| Agent | n | both | only first | only second | κ | repeated (both / first) |
|---|---|---|---|---|---|---|
| googlebot | 680 | 75 | 1 | 3 | 0.97 | 98.7 % (75/76) [92.9, 99.8] |
| bingbot | 680 | 64 | 30 | 3 | 0.77 | 68.1 % (64/94) [58.1, 76.6] |
| gptbot | 680 | 286 | 9 | 2 | 0.97 | 96.9 % (286/295) [94.3, 98.4] |
| oai-searchbot | 680 | 67 | 8 | 0 | 0.94 | 89.3 % (67/75) [80.3, 94.5] |
| chatgpt-user | 680 | 74 | 9 | 0 | 0.94 | 89.2 % (74/83) [80.7, 94.2] |
| claudebot | 680 | 335 | 12 | 4 | 0.95 | 96.5 % (335/347) [94.1, 98.0] |
| claude-searchbot | 680 | 29 | 8 | 1 | 0.86 | 78.4 % (29/37) [62.8, 88.6] |
| claude-user | 680 | 29 | 7 | 2 | 0.86 | 80.6 % (29/36) [65.0, 90.2] |
| perplexitybot | 680 | 78 | 0 | 4 | 0.97 | 100.0 % (78/78) [95.3, 100.0] |
| perplexity-user | 680 | 40 | 0 | 2 | 0.97 | 100.0 % (40/40) [91.2, 100.0] |
| meta-externalagent | 680 | 175 | 2 | 2 | 0.98 | 98.9 % (175/177) [96.0, 99.7] |
| ccbot | 680 | 272 | 2 | 3 | 0.98 | 99.3 % (272/274) [97.4, 99.8] |


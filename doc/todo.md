Je veux développer un plugin figjam, avec comme brief celui là @doc/brief.md. 
Pour la toute première version, voici ce que je veux développer : 

- Analyser les éléments du backbone (objectifs, acteurs, impacts, actions) :
  - Analyser tous les éléments du figjam
    - Un élément métier est un shape de type “square / rectangle” (FigJam shape avec fond). 
    - Les autres types (sticky, texte seul, image) sont ignorés. 
    - Le shape doit contenir au moins un texte non vide.
  - Détecter les objectifs, acteurs, impacts, actions, user stories, règles et scénarios :
    - les items sont détectés par la couleur de fond du shape  :  "OBJECTIVE": "#1E3A8A", "ACTOR": "#7C3AED", "IMPACT": "#16A34A", "ACTION": "#EA580C", "USER_STORY": "#FACC15", "RULE": "#64748B", "SCENARIO": "#CBD5E1"
    
- Analyser les éléments priorisés (user stories, règles, scénarios)
  - Détecter les sections de releases
    - les releases sont détectés grâce aux sections 
    - La section doit avoir un nom non vide.
    - Section.name est utilisé comme identifiant de release.
  - Détecter les user stories, règles, scénarios priorisées sur la release
    - les items sont détectés par la couleur de fond du shape : "USER_STORY": "#FACC15", "RULE": "#64748B", "SCENARIO": "#CBD5E1"

- Reconstruire la hiérarchie stricte (1 parent par élément)
  - Générer un JSON avec les items hierarchisées :
    - 1 parent par élément. objective → actor → impact → action → user story → règle → scénario
  - Afficher le JSON : 
    - "Given un board FigJam contenant les shapes suivants :
un shape rectangle
id obj-1
fill color = OBJECTIVE_COLOR
texte = Améliorer la qualité globale du delivery pendant les ateliers
un shape rectangle
id actor-1
fill color = ACTOR_COLOR
texte = Product Owner
un shape rectangle
id impact-1
fill color = IMPACT_COLOR
texte = Identifier et rendre explicites les zones de flou
un shape rectangle
id action-1
fill color = ACTION_COLOR
texte = Challenger les user stories et règles pendant l’atelier
un shape rectangle
id story-1
fill color = USER_STORY_COLOR
texte = En tant que Product Owner, je veux identifier les règles floues afin de clarifier les décisions produit
un shape rectangle
id rule-1
fill color = RULE_COLOR
texte = Les règles métier doivent être explicites et testables
un shape rectangle
id scenario-1
fill color = SCENARIO_COLOR
texte =
Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l’atelier afin de lever toute interprétation.

un shape rectangle
id scenario-2
fill color = SCENARIO_COLOR
texte =
Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.

And les connectors directionnels suivants existent :
obj-1 → actor-1
actor-1 → impact-1
impact-1 → action-1
action-1 → story-1
story-1 → rule-1
rule-1 → scenario-1
rule-1 → scenario-2
And une Section FigJam existe :
nom = MVP

And le centre géométrique du shape story-1 est contenu dans la Section MVP
When

When le plugin analyse le board FigJam

And détecte les types des shapes par leur fill color

And reconstruit la hiérarchie à partir des connectors

And assigne la release MVP à la User Story story-1

And propage la release MVP aux éléments enfants (rule-1, scenario-1, scenario-2)
Then

Then le plugin produit la hiérarchie JSON suivante :
{ "businessObjectives": [ { "id": "obj-1", "type": "OBJECTIVE", "title": "Améliorer la qualité globale du delivery pendant les ateliers", "children": [ { "id": "actor-1", "type": "ACTOR", "title": "Product Owner", "parentId": "obj-1", "children": [ { "id": "impact-1", "type": "IMPACT", "title": "Identifier et rendre explicites les zones de flou", "parentId": "actor-1", "children": [ { "id": "action-1", "type": "ACTION", "title": "Challenger les user stories et règles pendant l’atelier", "parentId": "impact-1", "children": [ { "id": "story-1", "type": "USER_STORY", "title": "En tant que Product Owner, je veux identifier les règles floues afin de clarifier les décisions produit", "parentId": "action-1", "release": "MVP", "children": [ { "id": "rule-1", "type": "RULE", "title": "Les règles métier doivent être explicites et testables", "parentId": "story-1", "release": "MVP", "children": [ { "id": "scenario-1", "type": "SCENARIO", "title": "Cas nominal", "parentId": "rule-1", "release": "MVP", "text": "Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l’atelier afin de lever toute interprétation." }, { "id": "scenario-2", "type": "SCENARIO", "title": "Cas limite", "parentId": "rule-1", "release": "MVP", "text": "Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification." } ] } ] } ] } ] } ] } ] } ] }"



Base toi sur les conventions de code et de structure de projet, de tests etc définies dans le projet discac-yoda (mais ne prends que ce qui est nécessaire ici), défini dans le dossier parent de ce projet. Pour l'instant pas besoin de backend, juste le plugin. Faites le code en TS. Si tu as le moindre doute ou besoin de précision, demande moi.
Modifie le claude.md etc en fonction de ce qui est nécessaire pour ce projet.





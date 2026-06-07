using System.Collections.Generic;
using DanQuest.Characters;
using UnityEngine;

namespace DanQuest.Core
{
    [CreateAssetMenu(menuName = "DAN QUEST/Roster", fileName = "DAN_QUEST_Roster")]
    public sealed class DanQuestRoster : ScriptableObject
    {
        public List<DanQuestCharacterData> heroes = new();
        public List<DanQuestCharacterData> bosses = new();

        public DanQuestCharacterData FirstSelectableHero()
        {
            foreach (var hero in heroes)
            {
                if (hero != null && hero.IsSelectable)
                {
                    return hero;
                }
            }

            return heroes.Count > 0 ? heroes[0] : null;
        }
    }
}

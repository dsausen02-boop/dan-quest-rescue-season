using DanQuest.Characters;

namespace DanQuest.Core
{
    public static class DanQuestGameSession
    {
        public static DanQuestCharacterData SelectedHero { get; private set; }

        public static void SelectHero(DanQuestCharacterData hero)
        {
            if (hero != null && hero.IsSelectable)
            {
                SelectedHero = hero;
            }
        }

        public static DanQuestCharacterData ResolveSelectedHero(DanQuestRoster roster)
        {
            if (SelectedHero != null && SelectedHero.IsSelectable)
            {
                return SelectedHero;
            }

            SelectedHero = roster != null ? roster.FirstSelectableHero() : null;
            return SelectedHero;
        }
    }
}

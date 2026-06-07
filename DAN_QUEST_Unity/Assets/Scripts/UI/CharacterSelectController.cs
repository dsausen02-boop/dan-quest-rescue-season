using System.Collections.Generic;
using DanQuest.Characters;
using DanQuest.Core;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace DanQuest.UI
{
    public sealed class CharacterSelectController : MonoBehaviour
    {
        public DanQuestRoster roster;
        public Transform cardContainer;
        public CharacterSelectCard cardPrefab;
        public Image selectedPortrait;
        public Text selectedNameText;
        public Text selectedRoleText;
        public Text selectedLockText;
        public Button playButton;
        public string arenaSceneName = "DAN_QUEST_Arena_Test";

        private readonly List<CharacterSelectCard> cards = new();
        private DanQuestCharacterData selectedHero;

        private void Start()
        {
            BuildCards();
            Select(DanQuestGameSession.ResolveSelectedHero(roster));

            if (playButton != null)
            {
                playButton.onClick.RemoveAllListeners();
                playButton.onClick.AddListener(LoadArena);
            }
        }

        public void Select(DanQuestCharacterData hero)
        {
            if (hero == null || !hero.IsSelectable)
            {
                return;
            }

            selectedHero = hero;
            DanQuestGameSession.SelectHero(hero);

            if (selectedPortrait != null)
            {
                selectedPortrait.sprite = hero.portrait;
                selectedPortrait.preserveAspect = true;
            }

            if (selectedNameText != null)
            {
                selectedNameText.text = hero.characterName;
            }

            if (selectedRoleText != null)
            {
                selectedRoleText.text = hero.role;
            }

            if (selectedLockText != null)
            {
                selectedLockText.text = hero.unlockStatus.ToString();
            }

            foreach (var card in cards)
            {
                card.SetSelected(card != null && card.name.Contains(hero.characterName));
            }
        }

        private void BuildCards()
        {
            if (roster == null || cardContainer == null || cardPrefab == null)
            {
                Debug.LogWarning("DAN QUEST: Character select is missing roster, card container, or card prefab.");
                return;
            }

            foreach (Transform child in cardContainer)
            {
                Destroy(child.gameObject);
            }

            cards.Clear();

            foreach (var hero in roster.heroes)
            {
                if (hero == null)
                {
                    continue;
                }

                var source = hero.selectionCardPrefab != null ? hero.selectionCardPrefab.GetComponent<CharacterSelectCard>() : cardPrefab;
                var card = Instantiate(source, cardContainer);
                card.name = $"{hero.characterName}_Card";
                card.Bind(hero, this);
                cards.Add(card);
            }
        }

        private void LoadArena()
        {
            if (selectedHero == null)
            {
                return;
            }

            DanQuestGameSession.SelectHero(selectedHero);
            SceneManager.LoadScene(arenaSceneName);
        }
    }
}

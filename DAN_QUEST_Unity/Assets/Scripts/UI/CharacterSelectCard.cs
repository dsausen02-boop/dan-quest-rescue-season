using DanQuest.Characters;
using UnityEngine;
using UnityEngine.UI;

namespace DanQuest.UI
{
    public sealed class CharacterSelectCard : MonoBehaviour
    {
        public Button button;
        public Image portrait;
        public Text nameText;
        public Text roleText;
        public Text lockText;
        public Image selectionFrame;

        private DanQuestCharacterData data;
        private CharacterSelectController owner;

        public void Bind(DanQuestCharacterData characterData, CharacterSelectController controller)
        {
            data = characterData;
            owner = controller;

            if (button == null)
            {
                button = GetComponent<Button>();
            }

            if (portrait != null)
            {
                portrait.sprite = data.portrait;
                portrait.preserveAspect = true;
            }

            if (nameText != null)
            {
                nameText.text = data.characterName;
            }

            if (roleText != null)
            {
                roleText.text = data.role;
            }

            var locked = !data.IsSelectable;
            if (lockText != null)
            {
                lockText.text = locked ? data.unlockStatus.ToString() : "Unlocked";
            }

            if (button != null)
            {
                button.interactable = !locked;
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => owner.Select(data));
            }
        }

        public void SetSelected(bool selected)
        {
            if (selectionFrame != null)
            {
                selectionFrame.enabled = selected;
            }
        }
    }
}

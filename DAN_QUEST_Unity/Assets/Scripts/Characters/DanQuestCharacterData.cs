using UnityEngine;

namespace DanQuest.Characters
{
    [CreateAssetMenu(menuName = "DAN QUEST/Character Data", fileName = "DAN_QUEST_Character")]
    public sealed class DanQuestCharacterData : ScriptableObject
    {
        public string characterId;
        public string characterName;
        public DanQuestCharacterType characterType;
        public Sprite portrait;
        public GameObject prefab;
        public GameObject selectionCardPrefab;
        public int health;
        public float speed;
        public string basicAttackName;
        public string specialAbilityName;
        public string ultimateName;
        public string role;
        public DanQuestUnlockStatus unlockStatus;
        public Color colorTheme = Color.white;

        public bool IsSelectable =>
            characterType == DanQuestCharacterType.Hero &&
            unlockStatus != DanQuestUnlockStatus.Locked &&
            unlockStatus != DanQuestUnlockStatus.LegendaryLocked;
    }
}

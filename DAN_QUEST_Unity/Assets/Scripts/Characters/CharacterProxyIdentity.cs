using UnityEngine;

namespace DanQuest.Characters
{
    public sealed class CharacterProxyIdentity : MonoBehaviour
    {
        public DanQuestCharacterData data;
        public Transform attackOrigin;
        public Animator animator;

        public void ApplyData(DanQuestCharacterData nextData)
        {
            data = nextData;
            if (data != null)
            {
                gameObject.name = $"{data.characterName}_3D_Proxy";
            }
        }
    }
}

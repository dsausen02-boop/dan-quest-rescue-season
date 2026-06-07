using DanQuest.Characters;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace DanQuest.Core
{
    public sealed class ArenaBootstrap : MonoBehaviour
    {
        public DanQuestRoster roster;
        public Transform playerSpawnPoint;
        public Transform bossSpawnPoint;
        public CameraFollowTarget followCamera;
        public Image heroPortrait;
        public Text heroNameText;
        public Text testSceneLabel;
        public Button returnButton;
        public string characterSelectSceneName = "DAN_QUEST_CharacterSelect";

        private void Start()
        {
            var selectedHero = DanQuestGameSession.ResolveSelectedHero(roster);
            SpawnHero(selectedHero);
            SpawnKashi();

            if (returnButton != null)
            {
                returnButton.onClick.RemoveAllListeners();
                returnButton.onClick.AddListener(ReturnToCharacterSelect);
            }

            if (testSceneLabel != null)
            {
                testSceneLabel.text = "DAN QUEST Arena Test - Unity 3D migration foundation";
            }
        }

        private void SpawnHero(DanQuestCharacterData selectedHero)
        {
            if (selectedHero == null || selectedHero.prefab == null || playerSpawnPoint == null)
            {
                Debug.LogWarning("DAN QUEST: Missing selected hero, prefab, or player spawn point.");
                return;
            }

            var hero = Instantiate(selectedHero.prefab, playerSpawnPoint.position, playerSpawnPoint.rotation);
            hero.name = $"{selectedHero.characterName}_Player";

            var identity = hero.GetComponent<CharacterProxyIdentity>();
            if (identity != null)
            {
                identity.ApplyData(selectedHero);
            }

            var controller = hero.GetComponent<PlayerController3D>();
            if (controller == null)
            {
                controller = hero.AddComponent<PlayerController3D>();
            }

            controller.characterData = selectedHero;

            if (identity != null && identity.attackOrigin != null)
            {
                controller.attackOrigin = identity.attackOrigin;
            }

            if (followCamera != null)
            {
                followCamera.target = hero.transform;
            }

            if (heroPortrait != null)
            {
                heroPortrait.sprite = selectedHero.portrait;
                heroPortrait.preserveAspect = true;
            }

            if (heroNameText != null)
            {
                heroNameText.text = selectedHero.characterName;
            }
        }

        private void SpawnKashi()
        {
            if (roster == null || roster.bosses.Count == 0 || bossSpawnPoint == null)
            {
                Debug.LogWarning("DAN QUEST: Missing Kashi boss data or boss spawn point.");
                return;
            }

            var kashi = roster.bosses[0];
            if (kashi == null || kashi.prefab == null)
            {
                return;
            }

            var boss = Instantiate(kashi.prefab, bossSpawnPoint.position, bossSpawnPoint.rotation);
            boss.name = "Kashi_Boss_Proxy";

            var identity = boss.GetComponent<CharacterProxyIdentity>();
            if (identity != null)
            {
                identity.ApplyData(kashi);
            }
        }

        private void ReturnToCharacterSelect()
        {
            SceneManager.LoadScene(characterSelectSceneName);
        }
    }
}

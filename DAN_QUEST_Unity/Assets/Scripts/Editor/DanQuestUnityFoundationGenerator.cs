using System;
using System.Collections.Generic;
using System.IO;
using DanQuest.Characters;
using DanQuest.Core;
using DanQuest.UI;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace DanQuest.EditorTools
{
    public static class DanQuestUnityFoundationGenerator
    {
        private const string RosterPath = "Assets/Characters/DAN_QUEST_Roster.asset";
        private const string CharacterSelectScenePath = "Assets/Scenes/DAN_QUEST_CharacterSelect.unity";
        private const string ArenaScenePath = "Assets/Scenes/DAN_QUEST_Arena_Test.unity";

        private sealed class CharacterSeed
        {
            public string Id;
            public string Name;
            public DanQuestCharacterType Type;
            public string PortraitFile;
            public int Health;
            public float Speed;
            public string Basic;
            public string Special;
            public string Ultimate;
            public string Role;
            public DanQuestUnlockStatus Unlock;
            public Color Color;
            public string Prop;
        }

        private readonly struct ProxySilhouetteProfile
        {
            public readonly Vector3 bodyPosition;
            public readonly Vector3 bodyScale;
            public readonly Vector3 headPosition;
            public readonly Vector3 headScale;
            public readonly Vector3 leftArmPosition;
            public readonly Vector3 rightArmPosition;
            public readonly Vector3 armScale;
            public readonly Vector3 leftLegPosition;
            public readonly Vector3 rightLegPosition;
            public readonly Vector3 legScale;
            public readonly Vector3 shadowScale;
            public readonly float leftArmAngle;
            public readonly float rightArmAngle;
            public readonly float leftLegAngle;
            public readonly float rightLegAngle;
            public readonly float yaw;

            public ProxySilhouetteProfile(Vector3 bodyPosition, Vector3 bodyScale, Vector3 headPosition, Vector3 headScale, Vector3 leftArmPosition, Vector3 rightArmPosition, Vector3 armScale, Vector3 leftLegPosition, Vector3 rightLegPosition, Vector3 legScale, Vector3 shadowScale, float leftArmAngle, float rightArmAngle, float leftLegAngle, float rightLegAngle, float yaw)
            {
                this.bodyPosition = bodyPosition;
                this.bodyScale = bodyScale;
                this.headPosition = headPosition;
                this.headScale = headScale;
                this.leftArmPosition = leftArmPosition;
                this.rightArmPosition = rightArmPosition;
                this.armScale = armScale;
                this.leftLegPosition = leftLegPosition;
                this.rightLegPosition = rightLegPosition;
                this.legScale = legScale;
                this.shadowScale = shadowScale;
                this.leftArmAngle = leftArmAngle;
                this.rightArmAngle = rightArmAngle;
                this.leftLegAngle = leftLegAngle;
                this.rightLegAngle = rightLegAngle;
                this.yaw = yaw;
            }
        }

        private static readonly CharacterSeed[] Seeds =
        {
            new() { Id = "amit", Name = "Amit", Type = DanQuestCharacterType.Hero, PortraitFile = "Amit.png", Health = 166, Speed = 5.1f, Basic = "Calm Down", Special = "Responsible Adult", Ultimate = "Enough", Role = "Support / Stabilizer", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.55f, 0.64f, 1f), Prop = "scroll" },
            new() { Id = "hadar", Name = "Hadar", Type = DanQuestCharacterType.Hero, PortraitFile = "Hadar.png", Health = 144, Speed = 5.3f, Basic = "YouTube Tutorial", Special = "Window Cleaning", Ultimate = "Washing Machine Recovery", Role = "Utility / Recovery", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(1f, 0.62f, 0.75f), Prop = "squeegee" },
            new() { Id = "tal", Name = "Tal", Type = DanQuestCharacterType.Hero, PortraitFile = "Tal.png", Health = 170, Speed = 5.2f, Basic = "Debate Attack", Special = "Presentation Barrage", Ultimate = "Psychometric Breakdown", Role = "Leader / Control", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(1f, 0.56f, 0.32f), Prop = "book" },
            new() { Id = "goodman", Name = "Goodman", Type = DanQuestCharacterType.Hero, PortraitFile = "Goodman.png", Health = 138, Speed = 5.0f, Basic = "Aggressive Strike", Special = "Chaos Push", Ultimate = "Goodman Chaos", Role = "Bruiser / Chaos", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.44f, 0.56f, 0.66f), Prop = "papers" },
            new() { Id = "halel", Name = "Halel", Type = DanQuestCharacterType.Hero, PortraitFile = "Halel.png", Health = 126, Speed = 5.8f, Basic = "Motorcycle Dash", Special = "Prince Focus", Ultimate = "Three Hour Ride", Role = "Fast Striker", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.61f, 0.47f, 0.87f), Prop = "crown" },
            new() { Id = "gellman", Name = "Gellman", Type = DanQuestCharacterType.Hero, PortraitFile = "Gellman.png", Health = 142, Speed = 5.0f, Basic = "Money Cannon", Special = "Business Class", Ultimate = "Thailand Spending Spree", Role = "Ranged Economy", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.96f, 0.77f, 0.32f), Prop = "money" },
            new() { Id = "farber", Name = "Farber", Type = DanQuestCharacterType.Hero, PortraitFile = "Farber.png", Health = 166, Speed = 4.8f, Basic = "Wrench Smash", Special = "Mechanic Fix", Ultimate = "Garage King", Role = "Tank / Mechanic", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.79f, 0.47f, 0.28f), Prop = "wrench" },
            new() { Id = "david", Name = "David", Type = DanQuestCharacterType.Hero, PortraitFile = "David.png", Health = 132, Speed = 5.1f, Basic = "AI Tool", Special = "Prompt Chain", Ultimate = "Artificial Intelligence", Role = "Tech Summoner", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.52f, 0.84f, 1f), Prop = "drone" },
            new() { Id = "mendel", Name = "Mendel", Type = DanQuestCharacterType.Hero, PortraitFile = "Mendel.png", Health = 126, Speed = 5.4f, Basic = "Banana Throw", Special = "No Filter", Ultimate = "Bedouin Army", Role = "Starter Chaos", Unlock = DanQuestUnlockStatus.StartingUnlocked, Color = new Color(0.93f, 0.40f, 0.34f), Prop = "banana" },
            new() { Id = "kuzar", Name = "Kuzar", Type = DanQuestCharacterType.Hero, PortraitFile = "Kuzar.png", Health = 132, Speed = 5.4f, Basic = "Coupon Attack", Special = "Cheap Move", Ultimate = "AGIG Disaster", Role = "Burst / Economy", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.41f, 0.77f, 0.54f), Prop = "coupon" },
            new() { Id = "amichai", Name = "Amichai", Type = DanQuestCharacterType.Hero, PortraitFile = "Amichai.png", Health = 150, Speed = 5.2f, Basic = "Winner Bet", Special = "Wake Up", Ultimate = "Soccer Tournament Beast Mode", Role = "Melee / Sports Burst", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.31f, 0.71f, 0.44f), Prop = "soccer" },
            new() { Id = "aviad", Name = "Aviad", Type = DanQuestCharacterType.Hero, PortraitFile = "Aviad.png", Health = 142, Speed = 5.1f, Basic = "Question Attack", Special = "Eternal Rookie", Ultimate = "Back To Basic Training", Role = "Rookie Soldier", Unlock = DanQuestUnlockStatus.Locked, Color = new Color(0.33f, 0.72f, 0.86f), Prop = "helmet" },
            new() { Id = "dan", Name = "Dan", Type = DanQuestCharacterType.Hero, PortraitFile = "Dan.png", Health = 240, Speed = 5.7f, Basic = "Blessing", Special = "Chosen One", Ultimate = "Weekend Miracle", Role = "Legendary Hero", Unlock = DanQuestUnlockStatus.LegendaryLocked, Color = new Color(1f, 0.94f, 0.66f), Prop = "aura" },
            new() { Id = "kashi", Name = "Kashi", Type = DanQuestCharacterType.Boss, PortraitFile = "Kashi.png", Health = 2600, Speed = 3.6f, Basic = "Assignments", Special = "Deadlines", Ultimate = "Infinite Spreadsheets", Role = "Corporate Emperor Boss", Unlock = DanQuestUnlockStatus.BossOnly, Color = new Color(0.49f, 0.24f, 0.72f), Prop = "crown" }
        };

        [InitializeOnLoadMethod]
        private static void AutoGenerateOnProjectOpen()
        {
            EditorApplication.delayCall += () =>
            {
                if (SessionState.GetBool("DAN_QUEST_FOUNDATION_GENERATED_THIS_SESSION", false))
                {
                    return;
                }

                SessionState.SetBool("DAN_QUEST_FOUNDATION_GENERATED_THIS_SESSION", true);
                if (AssetDatabase.LoadAssetAtPath<DanQuestRoster>(RosterPath) == null ||
                    !File.Exists(CharacterSelectScenePath) ||
                    !File.Exists(ArenaScenePath))
                {
                    GenerateFoundation();
                }
            };
        }

        [MenuItem("DAN QUEST/Generate Unity Foundation")]
        public static void GenerateFoundation()
        {
            EnsureFolders();
            ConfigurePortraitImports();
            ConfigureRenderPipeline();

            var projectileMaterial = CreateMaterial("DAN_QUEST_Projectile_Gold", new Color(1f, 0.82f, 0.24f));
            var heroes = new List<DanQuestCharacterData>();
            var bosses = new List<DanQuestCharacterData>();

            foreach (var seed in Seeds)
            {
                var data = CreateOrUpdateCharacterData(seed);
                var prefab = CreateOrUpdateProxyPrefab(seed, data, projectileMaterial);
                data.prefab = prefab;
                if (seed.Type == DanQuestCharacterType.Hero)
                {
                    data.selectionCardPrefab = CreateOrUpdateDedicatedCardPrefab(seed, data);
                }
                EditorUtility.SetDirty(data);

                if (seed.Type == DanQuestCharacterType.Hero)
                {
                    heroes.Add(data);
                }
                else
                {
                    bosses.Add(data);
                }
            }

            var roster = CreateOrUpdateRoster(heroes, bosses);
            CreateCharacterSelectScene(roster);
            CreateArenaScene(roster);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(CharacterSelectScenePath, true),
                new EditorBuildSettingsScene(ArenaScenePath, true)
            };

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("DAN QUEST Unity foundation generated.");
        }

        private static void EnsureFolders()
        {
            string[] folders =
            {
                "Assets/Characters",
                "Assets/Characters/Heroes",
                "Assets/Characters/Heroes/Data",
                "Assets/Characters/Bosses",
                "Assets/Characters/Bosses/Data",
                "Assets/Characters/AnimatorControllers",
                "Assets/Characters/Portraits",
                "Assets/Scripts/Core",
                "Assets/Scripts/Characters",
                "Assets/Scripts/Combat",
                "Assets/Scripts/UI",
                "Assets/Scripts/Editor",
                "Assets/Prefabs/Heroes",
                "Assets/Prefabs/Heroes/Cards",
                "Assets/Prefabs/Bosses",
                "Assets/Materials",
                "Assets/Audio",
                "Assets/Scenes",
                "Assets/Settings"
            };

            foreach (var folder in folders)
            {
                Directory.CreateDirectory(folder);
            }
        }

        private static void ConfigurePortraitImports()
        {
            foreach (var seed in Seeds)
            {
                var path = PortraitPath(seed);
                if (!File.Exists(path))
                {
                    Debug.LogWarning($"DAN QUEST: Missing portrait {path}");
                    continue;
                }

                var importer = AssetImporter.GetAtPath(path) as TextureImporter;
                if (importer == null)
                {
                    continue;
                }

                importer.textureType = TextureImporterType.Sprite;
                importer.spriteImportMode = SpriteImportMode.Single;
                importer.mipmapEnabled = false;
                importer.alphaIsTransparency = true;
                importer.SaveAndReimport();
            }
        }

        private static void ConfigureRenderPipeline()
        {
            var path = "Assets/Settings/DAN_QUEST_URP_Asset.asset";
            var existing = AssetDatabase.LoadAssetAtPath<RenderPipelineAsset>(path);
            if (existing == null)
            {
                var urpType = Type.GetType("UnityEngine.Rendering.Universal.UniversalRenderPipelineAsset, Unity.RenderPipelines.Universal.Runtime");
                if (urpType != null)
                {
                    existing = ScriptableObject.CreateInstance(urpType) as RenderPipelineAsset;
                    AssetDatabase.CreateAsset(existing, path);
                }
            }

            if (existing != null)
            {
                GraphicsSettings.defaultRenderPipeline = existing;
                QualitySettings.renderPipeline = existing;
            }
        }

        private static DanQuestCharacterData CreateOrUpdateCharacterData(CharacterSeed seed)
        {
            var folder = seed.Type == DanQuestCharacterType.Hero ? "Assets/Characters/Heroes/Data" : "Assets/Characters/Bosses/Data";
            var path = $"{folder}/{seed.Name}_Data.asset";
            var data = AssetDatabase.LoadAssetAtPath<DanQuestCharacterData>(path);
            if (data == null)
            {
                data = ScriptableObject.CreateInstance<DanQuestCharacterData>();
                AssetDatabase.CreateAsset(data, path);
            }

            data.characterId = seed.Id;
            data.characterName = seed.Name;
            data.characterType = seed.Type;
            data.portrait = AssetDatabase.LoadAssetAtPath<Sprite>(PortraitPath(seed));
            data.health = seed.Health;
            data.speed = seed.Speed;
            data.basicAttackName = seed.Basic;
            data.specialAbilityName = seed.Special;
            data.ultimateName = seed.Ultimate;
            data.role = seed.Role;
            data.unlockStatus = seed.Unlock;
            data.colorTheme = seed.Color;
            EditorUtility.SetDirty(data);
            return data;
        }

        private static DanQuestRoster CreateOrUpdateRoster(List<DanQuestCharacterData> heroes, List<DanQuestCharacterData> bosses)
        {
            var roster = AssetDatabase.LoadAssetAtPath<DanQuestRoster>(RosterPath);
            if (roster == null)
            {
                roster = ScriptableObject.CreateInstance<DanQuestRoster>();
                AssetDatabase.CreateAsset(roster, RosterPath);
            }

            roster.heroes = heroes;
            roster.bosses = bosses;
            EditorUtility.SetDirty(roster);
            return roster;
        }

        private static GameObject CreateOrUpdateProxyPrefab(CharacterSeed seed, DanQuestCharacterData data, Material projectileMaterial)
        {
            var folder = seed.Type == DanQuestCharacterType.Hero ? "Assets/Prefabs/Heroes" : "Assets/Prefabs/Bosses";
            var path = $"{folder}/{seed.Name}_Proxy.prefab";

            var bodyMaterial = CreateMaterial($"{seed.Name}_Proxy_Body", seed.Color);
            var accentMaterial = CreateMaterial($"{seed.Name}_Proxy_Accent", Color.Lerp(seed.Color, Color.white, 0.45f));
            var darkMaterial = CreateMaterial("DAN_QUEST_Dark_Details", new Color(0.08f, 0.09f, 0.13f));
            var skinMaterial = CreateMaterial("DAN_QUEST_Warm_Skin", new Color(0.86f, 0.60f, 0.42f));

            var root = new GameObject($"{seed.Name}_Proxy");
            root.transform.position = Vector3.zero;
            root.transform.rotation = Quaternion.identity;

            var identity = root.AddComponent<CharacterProxyIdentity>();
            identity.data = data;

            var animator = root.AddComponent<Animator>();
            animator.runtimeAnimatorController = CreateAnimatorController(seed);
            identity.animator = animator;

            var controller = root.AddComponent<CharacterController>();
            controller.height = seed.Type == DanQuestCharacterType.Boss ? 2.6f : 2.05f;
            controller.radius = seed.Type == DanQuestCharacterType.Boss ? 0.6f : 0.42f;
            controller.center = new Vector3(0f, controller.height * 0.5f, 0f);

            var profile = ProxyProfile(seed);
            root.transform.rotation = Quaternion.Euler(0f, profile.yaw, 0f);

            CreatePrimitive(root.transform, PrimitiveType.Capsule, "Body_Unique_Silhouette", profile.bodyPosition, profile.bodyScale, bodyMaterial);
            CreatePrimitive(root.transform, PrimitiveType.Sphere, "Head_Unique_Scale", profile.headPosition, profile.headScale, skinMaterial);
            CreatePrimitive(root.transform, PrimitiveType.Capsule, "Left_Arm_Stance", profile.leftArmPosition, profile.armScale, accentMaterial, Quaternion.Euler(0f, 0f, profile.leftArmAngle));
            CreatePrimitive(root.transform, PrimitiveType.Capsule, "Right_Arm_Stance", profile.rightArmPosition, profile.armScale, accentMaterial, Quaternion.Euler(0f, 0f, profile.rightArmAngle));
            CreatePrimitive(root.transform, PrimitiveType.Capsule, "Left_Leg_Stance", profile.leftLegPosition, profile.legScale, darkMaterial, Quaternion.Euler(0f, 0f, profile.leftLegAngle));
            CreatePrimitive(root.transform, PrimitiveType.Capsule, "Right_Leg_Stance", profile.rightLegPosition, profile.legScale, darkMaterial, Quaternion.Euler(0f, 0f, profile.rightLegAngle));
            CreatePrimitive(root.transform, PrimitiveType.Cylinder, "Base_Shadow", new Vector3(0f, 0.03f, 0f), profile.shadowScale, darkMaterial);

            var attackOrigin = new GameObject("AttackOrigin");
            attackOrigin.transform.SetParent(root.transform);
            attackOrigin.transform.localPosition = new Vector3(0f, 1.05f, 0.72f);
            identity.attackOrigin = attackOrigin.transform;

            AddProxyProp(root.transform, seed, accentMaterial, darkMaterial);

            if (seed.Type == DanQuestCharacterType.Hero)
            {
                var player = root.AddComponent<PlayerController3D>();
                player.characterData = data;
                player.attackOrigin = attackOrigin.transform;
                player.projectileMaterial = projectileMaterial;
            }

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        private static RuntimeAnimatorController CreateAnimatorController(CharacterSeed seed)
        {
            const string folder = "Assets/Characters/AnimatorControllers";
            Directory.CreateDirectory(folder);
            var path = $"{folder}/{seed.Name}_Animator.controller";
            var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(path);
            if (controller == null)
            {
                controller = AnimatorController.CreateAnimatorControllerAtPath(path);
            }

            return controller;
        }

        private static ProxySilhouetteProfile ProxyProfile(CharacterSeed seed)
        {
            return seed.Id switch
            {
                "amit" => Profile(0.58f, 0.92f, 0.36f, 0.16f, -24f, 22f, -7f, 8f, -6f),
                "hadar" => Profile(0.50f, 0.86f, 0.34f, 0.22f, -58f, -18f, -12f, 16f, 9f),
                "tal" => Profile(0.62f, 1.04f, 0.38f, 0.10f, -70f, 34f, -4f, 4f, -10f),
                "goodman" => Profile(0.72f, 0.95f, 0.37f, 0.04f, -35f, 62f, -14f, 14f, 12f),
                "halel" => Profile(0.48f, 1.02f, 0.34f, 0.02f, -20f, 20f, -24f, 28f, -18f),
                "gellman" => Profile(0.66f, 0.90f, 0.38f, 0.08f, -42f, 42f, -6f, 6f, 15f),
                "farber" => Profile(0.78f, 1.10f, 0.39f, 0.00f, -22f, 74f, -10f, 10f, -12f),
                "david" => Profile(0.52f, 0.94f, 0.35f, 0.18f, -18f, 48f, -18f, 20f, 18f),
                "mendel" => Profile(0.56f, 0.88f, 0.36f, 0.20f, -65f, 18f, -20f, 18f, -8f),
                "kuzar" => Profile(0.50f, 0.90f, 0.34f, -0.02f, -32f, 28f, -16f, 16f, 7f),
                "amichai" => Profile(0.74f, 0.92f, 0.38f, 0.02f, -82f, 82f, -28f, 28f, 0f),
                "aviad" => Profile(0.54f, 0.98f, 0.35f, 0.12f, -18f, 70f, -10f, 14f, -16f),
                "dan" => Profile(0.64f, 1.18f, 0.40f, 0.02f, -36f, 36f, -8f, 8f, 0f),
                "kashi" => Profile(0.96f, 1.36f, 0.52f, 0.00f, -72f, 72f, -12f, 12f, 0f, true),
                _ => Profile(0.56f, 0.92f, 0.36f, 0.00f, -30f, 30f, -8f, 8f, 0f)
            };
        }

        private static ProxySilhouetteProfile Profile(float bodyWidth, float bodyHeight, float headSize, float shoulderLift, float leftArmAngle, float rightArmAngle, float leftLegAngle, float rightLegAngle, float yaw, bool boss = false)
        {
            var bodyPosition = new Vector3(0f, boss ? 1.2f : 1.02f, 0f);
            var bodyScale = new Vector3(bodyWidth, bodyHeight, bodyWidth * 0.88f);
            var headPosition = new Vector3(0f, bodyPosition.y + bodyHeight * 0.86f + 0.46f, 0f);
            var headScale = Vector3.one * headSize;
            var armY = bodyPosition.y + shoulderLift + bodyHeight * 0.15f;
            var legY = 0.42f;
            var armScale = new Vector3(0.12f, boss ? 0.76f : 0.56f, 0.12f);
            var legScale = new Vector3(0.13f, boss ? 0.72f : 0.54f, 0.13f);
            var shadow = new Vector3(bodyWidth * (boss ? 1.75f : 1.55f), 0.04f, bodyWidth * (boss ? 1.75f : 1.55f));

            return new ProxySilhouetteProfile(
                bodyPosition,
                bodyScale,
                headPosition,
                headScale,
                new Vector3(-bodyWidth * 0.62f, armY, 0.06f),
                new Vector3(bodyWidth * 0.62f, armY, 0.06f),
                armScale,
                new Vector3(-bodyWidth * 0.22f, legY, 0f),
                new Vector3(bodyWidth * 0.22f, legY, 0f),
                legScale,
                shadow,
                leftArmAngle,
                rightArmAngle,
                leftLegAngle,
                rightLegAngle,
                yaw);
        }

        private static void AddProxyProp(Transform parent, CharacterSeed seed, Material accent, Material dark)
        {
            switch (seed.Prop)
            {
                case "banana":
                    CreatePrimitive(parent, PrimitiveType.Capsule, "Banana_Prop", new Vector3(0.48f, 1.18f, 0.22f), new Vector3(0.14f, 0.34f, 0.14f), accent, Quaternion.Euler(0f, 0f, 45f));
                    break;
                case "book":
                    CreatePrimitive(parent, PrimitiveType.Cube, "Book_Prop", new Vector3(0.48f, 1.12f, 0.16f), new Vector3(0.34f, 0.44f, 0.08f), accent);
                    break;
                case "squeegee":
                    CreatePrimitive(parent, PrimitiveType.Cylinder, "Window_Cleaner_Handle", new Vector3(0.52f, 1.12f, 0.1f), new Vector3(0.05f, 0.55f, 0.05f), dark, Quaternion.Euler(0f, 0f, -35f));
                    CreatePrimitive(parent, PrimitiveType.Cube, "Window_Cleaner_Blade", new Vector3(0.72f, 0.88f, 0.1f), new Vector3(0.38f, 0.06f, 0.08f), accent);
                    break;
                case "papers":
                    CreatePrimitive(parent, PrimitiveType.Cube, "Report_Prop", new Vector3(0.48f, 1.1f, 0.18f), new Vector3(0.32f, 0.42f, 0.04f), accent);
                    break;
                case "crown":
                    CreatePrimitive(parent, PrimitiveType.Cylinder, "Crown_Band", new Vector3(0f, seed.Type == DanQuestCharacterType.Boss ? 2.62f : 2.05f, 0f), new Vector3(0.42f, 0.13f, 0.42f), accent);
                    break;
                case "money":
                    CreatePrimitive(parent, PrimitiveType.Cube, "Money_Prop", new Vector3(0.5f, 1.15f, 0.16f), new Vector3(0.42f, 0.24f, 0.04f), accent);
                    break;
                case "wrench":
                    CreatePrimitive(parent, PrimitiveType.Cylinder, "Wrench_Handle", new Vector3(0.52f, 1f, 0.12f), new Vector3(0.06f, 0.6f, 0.06f), dark, Quaternion.Euler(0f, 0f, -42f));
                    CreatePrimitive(parent, PrimitiveType.Sphere, "Wrench_End", new Vector3(0.76f, 1.28f, 0.12f), Vector3.one * 0.18f, accent);
                    break;
                case "drone":
                    CreatePrimitive(parent, PrimitiveType.Sphere, "Drone_Core", new Vector3(0.62f, 1.55f, 0.18f), Vector3.one * 0.22f, accent);
                    break;
                case "coupon":
                    CreatePrimitive(parent, PrimitiveType.Cube, "Coupon_Prop", new Vector3(0.5f, 1.12f, 0.16f), new Vector3(0.42f, 0.24f, 0.04f), accent);
                    break;
                case "soccer":
                    CreatePrimitive(parent, PrimitiveType.Sphere, "Soccer_Prop", new Vector3(0.52f, 0.72f, 0.24f), Vector3.one * 0.24f, accent);
                    break;
                case "helmet":
                    CreatePrimitive(parent, PrimitiveType.Sphere, "Helmet_Prop", new Vector3(0f, 1.88f, 0f), new Vector3(0.42f, 0.24f, 0.42f), accent);
                    break;
                case "aura":
                    CreatePrimitive(parent, PrimitiveType.Sphere, "Golden_Aura_Proxy", new Vector3(0f, 1.08f, 0f), Vector3.one * 1.6f, accent);
                    break;
                case "scroll":
                    CreatePrimitive(parent, PrimitiveType.Cylinder, "Scroll_Prop", new Vector3(0.5f, 1.12f, 0.14f), new Vector3(0.08f, 0.5f, 0.08f), accent, Quaternion.Euler(0f, 0f, 90f));
                    break;
            }
        }

        private static void CreateCharacterSelectScene(DanQuestRoster roster)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "DAN_QUEST_CharacterSelect";

            var camera = new GameObject("UI Camera").AddComponent<Camera>();
            camera.transform.position = new Vector3(0f, 0f, -10f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.06f, 0.08f, 0.12f);

            CreateEventSystem();

            var canvas = CreateCanvas("Character Select Canvas");
            var root = CreatePanel(canvas.transform, "Character Select Root", Stretch(), new Color(0.07f, 0.09f, 0.14f, 1f));

            var title = CreateText(root.transform, "Title", "DAN QUEST", 42, TextAnchor.MiddleLeft, new Color(1f, 0.94f, 0.66f));
            SetRect(title.rectTransform, new Vector2(24f, -22f), new Vector2(520f, 68f), new Vector2(0f, 1f), new Vector2(0f, 1f));

            var subtitle = CreateText(root.transform, "Subtitle", "Unity 3D Character Select - portraits are UI/reference only", 18, TextAnchor.MiddleLeft, Color.white);
            SetRect(subtitle.rectTransform, new Vector2(26f, -80f), new Vector2(820f, 38f), new Vector2(0f, 1f), new Vector2(0f, 1f));

            var grid = new GameObject("Hero Card Grid", typeof(RectTransform), typeof(GridLayoutGroup));
            grid.transform.SetParent(root.transform, false);
            var gridRect = grid.GetComponent<RectTransform>();
            SetRect(gridRect, new Vector2(28f, -145f), new Vector2(840f, 620f), new Vector2(0f, 1f), new Vector2(0f, 1f));
            var gridLayout = grid.GetComponent<GridLayoutGroup>();
            gridLayout.cellSize = new Vector2(150f, 190f);
            gridLayout.spacing = new Vector2(12f, 12f);
            gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridLayout.constraintCount = 5;

            var detailPanel = CreatePanel(root.transform, "Selected Hero Panel", AnchorRect(0.72f, 0.11f, 0.98f, 0.86f), new Color(0.12f, 0.14f, 0.20f, 0.96f));
            var selectedPortrait = CreateImage(detailPanel.transform, "Selected Portrait", null, new Color(1f, 1f, 1f, 1f));
            SetRect(selectedPortrait.rectTransform, new Vector2(0f, -45f), new Vector2(250f, 330f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));
            selectedPortrait.preserveAspect = true;

            var selectedName = CreateText(detailPanel.transform, "Selected Name", "Mendel", 30, TextAnchor.MiddleCenter, new Color(1f, 0.94f, 0.66f));
            SetRect(selectedName.rectTransform, new Vector2(0f, -390f), new Vector2(300f, 48f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));

            var selectedRole = CreateText(detailPanel.transform, "Selected Role", "Starter Chaos", 18, TextAnchor.MiddleCenter, Color.white);
            SetRect(selectedRole.rectTransform, new Vector2(0f, -440f), new Vector2(310f, 64f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));

            var selectedLock = CreateText(detailPanel.transform, "Selected Unlock", "StartingUnlocked", 16, TextAnchor.MiddleCenter, new Color(0.55f, 1f, 0.65f));
            SetRect(selectedLock.rectTransform, new Vector2(0f, -505f), new Vector2(310f, 34f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));

            var playButton = CreateButton(detailPanel.transform, "Play Button", "Enter Arena Test", new Color(0.95f, 0.65f, 0.22f));
            SetRect(playButton.GetComponent<RectTransform>(), new Vector2(0f, 42f), new Vector2(260f, 54f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var cardPrefab = CreateCardPrefab();
            var controllerObject = new GameObject("Character Select Controller");
            var controller = controllerObject.AddComponent<CharacterSelectController>();
            controller.roster = roster;
            controller.cardContainer = grid.transform;
            controller.cardPrefab = cardPrefab.GetComponent<CharacterSelectCard>();
            controller.selectedPortrait = selectedPortrait;
            controller.selectedNameText = selectedName;
            controller.selectedRoleText = selectedRole;
            controller.selectedLockText = selectedLock;
            controller.playButton = playButton.GetComponent<Button>();
            controller.arenaSceneName = "DAN_QUEST_Arena_Test";

            EditorSceneManager.SaveScene(scene, CharacterSelectScenePath);
        }

        private static void CreateArenaScene(DanQuestRoster roster)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "DAN_QUEST_Arena_Test";

            RenderSettings.ambientLight = new Color(0.35f, 0.39f, 0.48f);

            var cameraObject = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener), typeof(CameraFollowTarget));
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = new Vector3(0f, 8.5f, -7.5f);
            cameraObject.transform.rotation = Quaternion.Euler(52f, 0f, 0f);
            var camera = cameraObject.GetComponent<Camera>();
            camera.fieldOfView = 48f;
            var follow = cameraObject.GetComponent<CameraFollowTarget>();

            TryCreateOptionalCinemachineRig();

            var light = new GameObject("Directional Light").AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 2.25f;
            light.transform.rotation = Quaternion.Euler(50f, -32f, 0f);

            var floorMaterial = CreateMaterial("DAN_QUEST_Arena_Floor", new Color(0.18f, 0.34f, 0.23f));
            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Simple Arena Floor";
            floor.transform.localScale = new Vector3(2.8f, 1f, 2.8f);
            floor.GetComponent<Renderer>().sharedMaterial = floorMaterial;

            var playerSpawn = new GameObject("Player Spawn Point");
            playerSpawn.transform.position = new Vector3(-4f, 0.05f, 0f);
            playerSpawn.transform.rotation = Quaternion.LookRotation(Vector3.right, Vector3.up);

            var bossSpawn = new GameObject("Kashi Boss Spawn Point");
            bossSpawn.transform.position = new Vector3(5f, 0.05f, 0f);
            bossSpawn.transform.rotation = Quaternion.LookRotation(Vector3.left, Vector3.up);

            var canvas = CreateCanvas("Arena Test UI Canvas");
            var topPanel = CreatePanel(canvas.transform, "Arena UI Placeholder", AnchorRect(0f, 0.86f, 1f, 1f), new Color(0.06f, 0.08f, 0.12f, 0.88f));
            var portrait = CreateImage(topPanel.transform, "Hero Portrait", null, Color.white);
            SetRect(portrait.rectTransform, new Vector2(22f, -12f), new Vector2(86f, 86f), new Vector2(0f, 1f), new Vector2(0f, 1f));
            portrait.preserveAspect = true;

            var heroName = CreateText(topPanel.transform, "Hero Name", "Selected Hero", 26, TextAnchor.MiddleLeft, new Color(1f, 0.94f, 0.66f));
            SetRect(heroName.rectTransform, new Vector2(122f, -18f), new Vector2(420f, 42f), new Vector2(0f, 1f), new Vector2(0f, 1f));

            var label = CreateText(topPanel.transform, "Scene Label", "DAN QUEST Arena Test", 16, TextAnchor.MiddleLeft, Color.white);
            SetRect(label.rectTransform, new Vector2(124f, -62f), new Vector2(650f, 30f), new Vector2(0f, 1f), new Vector2(0f, 1f));

            var returnButton = CreateButton(topPanel.transform, "Return Button", "Character Select", new Color(0.28f, 0.34f, 0.46f));
            SetRect(returnButton.GetComponent<RectTransform>(), new Vector2(-22f, -22f), new Vector2(190f, 48f), new Vector2(1f, 1f), new Vector2(1f, 1f));

            var bootstrapObject = new GameObject("DAN QUEST Arena Bootstrap");
            var bootstrap = bootstrapObject.AddComponent<ArenaBootstrap>();
            bootstrap.roster = roster;
            bootstrap.playerSpawnPoint = playerSpawn.transform;
            bootstrap.bossSpawnPoint = bossSpawn.transform;
            bootstrap.followCamera = follow;
            bootstrap.heroPortrait = portrait;
            bootstrap.heroNameText = heroName;
            bootstrap.testSceneLabel = label;
            bootstrap.returnButton = returnButton.GetComponent<Button>();
            bootstrap.characterSelectSceneName = "DAN_QUEST_CharacterSelect";

            EditorSceneManager.SaveScene(scene, ArenaScenePath);
        }

        private static void TryCreateOptionalCinemachineRig()
        {
            var cinemachineType =
                Type.GetType("Unity.Cinemachine.CinemachineCamera, Unity.Cinemachine") ??
                Type.GetType("Cinemachine.CinemachineVirtualCamera, Cinemachine");

            if (cinemachineType == null)
            {
                var marker = new GameObject("Cinemachine Package Placeholder");
                marker.transform.position = Vector3.zero;
                return;
            }

            var rig = new GameObject("Cinemachine Follow Camera");
            rig.AddComponent(cinemachineType);
        }

        private static GameObject CreateCardPrefab()
        {
            const string prefabPath = "Assets/Prefabs/Heroes/CharacterSelectCard.prefab";
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (existing != null)
            {
                return existing;
            }

            var root = new GameObject("CharacterSelectCard", typeof(RectTransform), typeof(Image), typeof(Button), typeof(CharacterSelectCard));
            var rect = root.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(150f, 190f);
            root.GetComponent<Image>().color = new Color(0.12f, 0.14f, 0.20f, 0.96f);

            var frame = CreateImage(root.transform, "Selection Frame", null, new Color(1f, 0.82f, 0.24f, 0.25f));
            frame.raycastTarget = false;
            SetRect(frame.rectTransform, Vector2.zero, new Vector2(150f, 190f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
            frame.enabled = false;

            var portrait = CreateImage(root.transform, "Portrait", null, Color.white);
            SetRect(portrait.rectTransform, new Vector2(0f, -8f), new Vector2(128f, 118f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));
            portrait.preserveAspect = true;

            var name = CreateText(root.transform, "Name", "Hero", 16, TextAnchor.MiddleCenter, new Color(1f, 0.94f, 0.66f));
            SetRect(name.rectTransform, new Vector2(0f, 54f), new Vector2(138f, 26f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var role = CreateText(root.transform, "Role", "Role", 11, TextAnchor.MiddleCenter, Color.white);
            SetRect(role.rectTransform, new Vector2(0f, 28f), new Vector2(138f, 34f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var lockText = CreateText(root.transform, "Lock", "Locked", 10, TextAnchor.MiddleCenter, new Color(0.66f, 0.82f, 1f));
            SetRect(lockText.rectTransform, new Vector2(0f, 8f), new Vector2(138f, 20f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var card = root.GetComponent<CharacterSelectCard>();
            card.button = root.GetComponent<Button>();
            card.portrait = portrait;
            card.nameText = name;
            card.roleText = role;
            card.lockText = lockText;
            card.selectionFrame = frame;

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        private static GameObject CreateOrUpdateDedicatedCardPrefab(CharacterSeed seed, DanQuestCharacterData data)
        {
            var prefabPath = $"Assets/Prefabs/Heroes/Cards/{seed.Name}_SelectionCard.prefab";
            var root = new GameObject($"{seed.Name}_SelectionCard", typeof(RectTransform), typeof(Image), typeof(Button), typeof(CharacterSelectCard));
            var rect = root.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(150f, 190f);
            root.GetComponent<Image>().color = Color.Lerp(seed.Color, new Color(0.07f, 0.09f, 0.14f), 0.55f);

            var frame = CreateImage(root.transform, "Selection Frame", null, new Color(seed.Color.r, seed.Color.g, seed.Color.b, 0.34f));
            frame.raycastTarget = false;
            SetRect(frame.rectTransform, Vector2.zero, new Vector2(150f, 190f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
            frame.enabled = false;

            var portrait = CreateImage(root.transform, $"{seed.Name}_Full_Portrait", data.portrait, Color.white);
            SetRect(portrait.rectTransform, new Vector2(0f, -8f), new Vector2(130f, 118f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f));
            portrait.preserveAspect = true;

            var colorStrip = CreateImage(root.transform, $"{seed.Name}_Color_Strip", null, seed.Color);
            SetRect(colorStrip.rectTransform, new Vector2(0f, 68f), new Vector2(150f, 8f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var name = CreateText(root.transform, $"{seed.Name}_Name", seed.Name, 16, TextAnchor.MiddleCenter, new Color(1f, 0.94f, 0.66f));
            SetRect(name.rectTransform, new Vector2(0f, 48f), new Vector2(138f, 28f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var role = CreateText(root.transform, $"{seed.Name}_Role", seed.Role, 10, TextAnchor.MiddleCenter, Color.white);
            SetRect(role.rectTransform, new Vector2(0f, 22f), new Vector2(138f, 34f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var lockText = CreateText(root.transform, $"{seed.Name}_Unlock", seed.Unlock == DanQuestUnlockStatus.StartingUnlocked ? "Unlocked" : seed.Unlock.ToString(), 10, TextAnchor.MiddleCenter, new Color(0.66f, 0.82f, 1f));
            SetRect(lockText.rectTransform, new Vector2(0f, 6f), new Vector2(138f, 18f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f));

            var card = root.GetComponent<CharacterSelectCard>();
            card.button = root.GetComponent<Button>();
            card.portrait = portrait;
            card.nameText = name;
            card.roleText = role;
            card.lockText = lockText;
            card.selectionFrame = frame;

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        private static GameObject CreatePrimitive(Transform parent, PrimitiveType type, string name, Vector3 localPosition, Vector3 localScale, Material material, Quaternion? localRotation = null)
        {
            var primitive = GameObject.CreatePrimitive(type);
            primitive.name = name;
            primitive.transform.SetParent(parent, false);
            primitive.transform.localPosition = localPosition;
            primitive.transform.localRotation = localRotation ?? Quaternion.identity;
            primitive.transform.localScale = localScale;

            var renderer = primitive.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.sharedMaterial = material;
            }

            var collider = primitive.GetComponent<Collider>();
            if (collider != null)
            {
                UnityEngine.Object.DestroyImmediate(collider);
            }

            return primitive;
        }

        private static Material CreateMaterial(string name, Color color)
        {
            var path = $"Assets/Materials/{name}.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material == null)
            {
                var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }

            material.color = color;
            EditorUtility.SetDirty(material);
            return material;
        }

        private static Canvas CreateCanvas(string name)
        {
            var canvasObject = new GameObject(name, typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.matchWidthOrHeight = 0.5f;

            return canvas;
        }

        private static void CreateEventSystem()
        {
            var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            var inputSystemModuleType = Type.GetType("UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
            if (inputSystemModuleType != null)
            {
                UnityEngine.Object.DestroyImmediate(eventSystem.GetComponent<StandaloneInputModule>());
                eventSystem.AddComponent(inputSystemModuleType);
            }
        }

        private static Image CreatePanel(Transform parent, string name, Rect rect, Color color)
        {
            var panel = new GameObject(name, typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(parent, false);
            var image = panel.GetComponent<Image>();
            image.color = color;
            ApplyRect(panel.GetComponent<RectTransform>(), rect);
            return image;
        }

        private static Image CreateImage(Transform parent, string name, Sprite sprite, Color color)
        {
            var imageObject = new GameObject(name, typeof(RectTransform), typeof(Image));
            imageObject.transform.SetParent(parent, false);
            var image = imageObject.GetComponent<Image>();
            image.sprite = sprite;
            image.color = color;
            return image;
        }

        private static Text CreateText(Transform parent, string name, string value, int size, TextAnchor anchor, Color color)
        {
            var textObject = new GameObject(name, typeof(RectTransform), typeof(Text));
            textObject.transform.SetParent(parent, false);
            var text = textObject.GetComponent<Text>();
            text.text = value;
            text.fontSize = size;
            text.alignment = anchor;
            text.color = color;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf") ?? Resources.GetBuiltinResource<Font>("Arial.ttf");
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            return text;
        }

        private static GameObject CreateButton(Transform parent, string name, string label, Color color)
        {
            var buttonObject = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            buttonObject.transform.SetParent(parent, false);
            var image = buttonObject.GetComponent<Image>();
            image.color = color;

            var text = CreateText(buttonObject.transform, "Label", label, 17, TextAnchor.MiddleCenter, Color.white);
            ApplyRect(text.rectTransform, Stretch());

            var colors = buttonObject.GetComponent<Button>().colors;
            colors.highlightedColor = Color.Lerp(color, Color.white, 0.18f);
            colors.pressedColor = Color.Lerp(color, Color.black, 0.18f);
            buttonObject.GetComponent<Button>().colors = colors;
            return buttonObject;
        }

        private static string PortraitPath(CharacterSeed seed)
        {
            return $"Assets/Characters/Portraits/{seed.PortraitFile}";
        }

        private static Rect Stretch()
        {
            return new Rect(0f, 0f, 1f, 1f);
        }

        private static Rect AnchorRect(float xMin, float yMin, float xMax, float yMax)
        {
            return new Rect(xMin, yMin, xMax - xMin, yMax - yMin);
        }

        private static void ApplyRect(RectTransform rect, Rect anchorRect)
        {
            rect.anchorMin = new Vector2(anchorRect.xMin, anchorRect.yMin);
            rect.anchorMax = new Vector2(anchorRect.xMax, anchorRect.yMax);
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }

        private static void SetRect(RectTransform rect, Vector2 anchoredPosition, Vector2 sizeDelta, Vector2 anchorMin, Vector2 anchorMax)
        {
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = anchoredPosition;
            rect.sizeDelta = sizeDelta;
        }
    }
}

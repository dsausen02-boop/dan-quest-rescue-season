using DanQuest.Combat;
using UnityEngine;
using UnityEngine.InputSystem;

namespace DanQuest.Characters
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class PlayerController3D : MonoBehaviour
    {
        public DanQuestCharacterData characterData;
        public Transform attackOrigin;
        public Material projectileMaterial;
        public float rotationSpeed = 14f;

        private CharacterController controller;
        private InputAction moveAction;
        private InputAction attackAction;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            if (attackOrigin == null)
            {
                attackOrigin = transform;
            }

            moveAction = new InputAction("Move", InputActionType.Value, expectedControlType: "Vector2");
            moveAction.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/w")
                .With("Up", "<Keyboard>/upArrow")
                .With("Down", "<Keyboard>/s")
                .With("Down", "<Keyboard>/downArrow")
                .With("Left", "<Keyboard>/a")
                .With("Left", "<Keyboard>/leftArrow")
                .With("Right", "<Keyboard>/d")
                .With("Right", "<Keyboard>/rightArrow");
            moveAction.AddBinding("<Gamepad>/leftStick");

            attackAction = new InputAction("Basic Attack", InputActionType.Button);
            attackAction.AddBinding("<Mouse>/leftButton");
            attackAction.AddBinding("<Keyboard>/space");
            attackAction.AddBinding("<Gamepad>/buttonSouth");
            attackAction.performed += _ => FirePlaceholderAttack();
        }

        private void OnEnable()
        {
            moveAction.Enable();
            attackAction.Enable();
        }

        private void OnDisable()
        {
            moveAction.Disable();
            attackAction.Disable();
        }

        private void OnDestroy()
        {
            moveAction.Dispose();
            attackAction.Dispose();
        }

        private void Update()
        {
            var input = moveAction.ReadValue<Vector2>();
            var move = new Vector3(input.x, 0f, input.y);
            var speed = characterData != null ? characterData.speed : 5f;

            if (move.sqrMagnitude > 0.001f)
            {
                var desired = Quaternion.LookRotation(move.normalized, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, desired, rotationSpeed * Time.deltaTime);
                controller.SimpleMove(move.normalized * speed);
            }
            else
            {
                controller.SimpleMove(Vector3.zero);
            }
        }

        private void FirePlaceholderAttack()
        {
            var origin = attackOrigin != null ? attackOrigin : transform;
            var projectile = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            projectile.name = characterData != null ? $"{characterData.basicAttackName}_Placeholder" : "Basic_Attack_Placeholder";
            projectile.transform.position = origin.position + transform.forward * 0.8f + Vector3.up * 0.9f;
            projectile.transform.localScale = Vector3.one * 0.22f;

            var collider = projectile.GetComponent<Collider>();
            if (collider != null)
            {
                Destroy(collider);
            }

            var renderer = projectile.GetComponent<Renderer>();
            if (renderer != null && projectileMaterial != null)
            {
                renderer.sharedMaterial = projectileMaterial;
            }

            var shot = projectile.AddComponent<PlaceholderProjectile>();
            shot.direction = transform.forward;
        }
    }
}

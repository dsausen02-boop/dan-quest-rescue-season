using UnityEngine;

namespace DanQuest.Combat
{
    public sealed class PlaceholderProjectile : MonoBehaviour
    {
        public float speed = 10f;
        public float lifetime = 1.4f;
        public Vector3 direction = Vector3.forward;

        private void Update()
        {
            transform.position += direction.normalized * speed * Time.deltaTime;
            lifetime -= Time.deltaTime;

            if (lifetime <= 0f)
            {
                Destroy(gameObject);
            }
        }
    }
}

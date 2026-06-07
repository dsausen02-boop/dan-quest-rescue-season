using UnityEngine;

namespace DanQuest.Core
{
    public sealed class CameraFollowTarget : MonoBehaviour
    {
        public Transform target;
        public Vector3 offset = new(0f, 8.5f, -7.5f);
        public float followSharpness = 8f;
        public float lookAhead = 1.1f;

        private void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            var desiredPosition = target.position + offset;
            transform.position = Vector3.Lerp(transform.position, desiredPosition, 1f - Mathf.Exp(-followSharpness * Time.deltaTime));
            transform.LookAt(target.position + Vector3.up * lookAhead);
        }
    }
}

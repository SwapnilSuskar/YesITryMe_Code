const statusBorder = {
  free: "border-2 border-red-500",
  active: "border-2 border-yellow-400",
  kyc_verified: "border-2 border-green-500",
  blocked: "border-2 border-black",
};

const UserAvatar = ({
  imageUrl,
  firstName = "",
  lastName = "",
  status = "free",
  size = 40,
  className = "",
  ...props
}) => {
  const borderClass = statusBorder[status] || "border-2 border-gray-300";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  // Generate fallback URL
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName + " " + lastName
  )}&background=ff6b35&color=fff&size=${size * 2}`;

  // Use imageUrl if available, otherwise use fallback
  const src = imageUrl || fallbackUrl;

  return (
    <div
      className={`inline-block rounded-full ${borderClass} shadow-sm relative ${className}`}
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt={initials}
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          e.target.src = fallbackUrl;
        }}
        {...props}
      />
    </div>
  );
};

export default UserAvatar;
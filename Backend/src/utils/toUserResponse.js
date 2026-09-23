function toUserResponse(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone ?? null,
    location: user.location ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = toUserResponse;
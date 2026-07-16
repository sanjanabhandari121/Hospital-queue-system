exports.registerPatient = async (req, res) => {
  try {
    console.log("Incoming Register Request:", req.body);

    const { name, email, password, phone, gender, age, bloodGroup } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already exists"
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "Patient"
    });

    console.log("User Created:", user);

    const patient = await Patient.create({
      user: user._id,
      gender,
      age,
      bloodGroup
    });

    console.log("Patient Created:", patient);

    res.status(201).json({
      success: true,
      token: makeToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:");
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
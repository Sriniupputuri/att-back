import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      role,
    });

    await user.save();
    console.log('Saved user password hash:', user.password);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Debug log the received password
    console.log('Login - Received Password:', password);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Explicitly test bcrypt comparison
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('bcrypt.compare result:', isPasswordValid);
      
      // Additional verification
      const testHash = await bcrypt.hash(password, 10);
      console.log('Test hash of received password:', testHash);
      
    } catch (bcryptError) {
      console.error('bcrypt.compare error:', bcryptError);
      return res.status(500).json({ message: 'Error validating credentials' });
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      // Use consistent salt rounds
      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
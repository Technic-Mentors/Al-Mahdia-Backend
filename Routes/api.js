const Products = require("../Schema/products")
const express = require("express")
const router = express.Router()
const multer = require("multer");
const cloudinary = require("../Cloudinary");
const bcrypt = require("bcrypt");
const User = require("../Schema/User");
const products = require("../Schema/products");
const Category = require("../Schema/Category")
const Order = require("../Schema/Orders")
const orderDetail = require("../Schema/OrderDetail")
// img storage path
const imgconfig = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, `image-${Date.now()}.${file.originalname}`)
    }
});

// img filter
const isImage = (req, file, callback) => {
    if (file.mimetype.startsWith("image")) {
        callback(null, true)
    } else {
        callback(new Error("only images is allow"))
    }
}

const upload = multer({
    storage: imgconfig,
    fileFilter: isImage
})

const createAdmin = async () => {
    const adminName = "E-commerce admin"
    const adminEmail = "ecommerceadmin@gmail.com"
    const adminPassword = "1234"
    const checkEmail = await User.findOne({ email: adminEmail })
    if (checkEmail) {
        return;
    }
    const hashPassword = await bcrypt.hash(adminPassword, 10)
    const adminData = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashPassword,
        role: "admin"
    })
    console.log("admin created", adminData)
}
createAdmin()

router.post("/signUp", async (req, res) => {
    try {
        const { name, email, number, password, confirmPassword } = req.body
        const checkEmail = await User.findOne({ email })
        if (checkEmail) {
            return res.status(400).json({ message: "user with this email already exists" })
        }

        const checkNumber = await User.findOne({ number })
        if (checkNumber) {
            return res.status(400).json({ message: "This number already used" })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "password does not match" })
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            name,
            email,
            password: hashPassword,
            number,
            role: "shopManager"
        })
        res.json(newUser)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.post("/signIn", async (req, res) => {
    try {
        const { email, password } = req.body
        const checkEmail = await User.findOne({ email })
        if (!checkEmail) {
            return res.status(400).json({ message: "Not found any user with this email" })
        }

        const checkPassword = await bcrypt.compare(password, checkEmail.password)
        if (!checkPassword) {
            return res.status(400).json({ message: "Not found any user with this password" })
        }

        res.json(checkEmail)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.get("/allUsers", async (req, res) => {
    try {
        const allUsers = await User.find()
        res.json(allUsers)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.get("/idUser/:id", async (req, res) => {
    try {
        const checkUser = await User.findOne(req.params.id)
        if (!checkUser) {
            return res.send(400).json({ message: "User with this id not found" })
        }
        res.json(checkUser)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})
router.put("/UpdateUser/:id", async (req, res) => {
    try {
        const { name, email, number, password } = req.body
        const checkUser = await User.findOne(req.params.id)
        if (!checkUser) {
            return res.send(400).json({ message: "User with this id not found" })
        }
        let newUser = {}
        if (name) {
            newUser.name = name
        }
        if (email) {
            newUser.email = email
        }
        if (number) {
            newUser.number = number
        }
        if (password) {
            newUser.password = password
        }

        const updateUser = await User.findByIdAndUpdate(req.params.id, { $set: newUser }, { new: true })
        res.json(updateUser)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.delete("/userDelete/:id", async (req, res) => {
    try {
        const delUser = await User.findByIdAndDelete(req.params.id)
        if (!delUser) {
            return res.send(400).json({ message: "User with this id not found" })
        }
        res.json({ message: "user deleted successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.post("/addCategory", async (req, res) => {
    try {
        const { category } = req.body
        const checkCategory = await Category.findOne({ category })
        if (checkCategory) {
            return res.status(400).json({ message: "Category already exists" })
        }
        const newCategory = await Category.create({ category })
        res.json(newCategory)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})
router.get("/allCategories", async (req, res) => {
    try {
        const allCategories = await Category.find()
        res.json(allCategories)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})
router.delete("/delcat/:id", async (req, res) => {
    try {
        const cat = await Category.findByIdAndDelete(req.params.id)
        if (!cat) {
            return res.status(400).json({ message: "not found any category against this id" })
        }
        res.json(cat)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})
router.post("/addProducts", upload.single("image"), async (req, res) => {
    try {
        const { title, price, description, categoryId } = req.body
        const checkTitle = await Products.findOne({ title })
        if (checkTitle) {
            return res.status(400).json({ message: "Title already used" })
        }
        let img_url;
        if (req.file) {
            const upload = await cloudinary.uploader.upload(req.file.path);
            img_url = upload.secure_url
        }
        const newProduct = await Products.create({
            title,
            categoryId,
            description,
            image: img_url,
            price
        })
        res.json(newProduct)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.get("/allProducts", async (req, res) => {
    try {
        const allProducts = await products.find().populate("categoryId", "category")
        res.json(allProducts)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.get("/getProdct/:id", async (req, res) => {
    try {
        const ProductId = await Products.findById(req.params.id)
            .populate("categoryId", "category")
        res.json(ProductId)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})
router.put("/updateProdct/:id", upload.single("image"), async (req, res) => {
    try {
        const { title, price, description, categoryId } = req.body
        const newProduct = {}

        if (req.file) {
            const upload = await cloudinary.uploader.upload(req.file.path);
            newProduct.image = upload.secure_url
        }
        if (title) {
            newProduct.title = title
        }
        if (price) {
            newProduct.price = price
        }
        if (description) {
            newProduct.description = description
        }
        if (categoryId) {
            newProduct.categoryId = categoryId
        }

        let checkProduct = await Products.findById(req.params.id)
        if (!checkProduct) {
            return res.status(400).json({ message: "product not found against this id" })
        }
        checkProduct = await Products.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true })
        res.json(checkProduct)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.get("/getProduct/:title", async (req, res) => {
    try {
        const titleProduct = await Products.findOne({ title: req.params.title })
            .populate("categoryId", "category")
        res.json(titleProduct)
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

router.delete("/delProduct/:id", async (req, res) => {
    try {
        const titleProduct = await Products.findByIdAndDelete(req.params.id)
        res.json({ message: "product deleted successfully", titleProduct })
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error occured")
    }
})

const generatOrderNumber = () => {
    const randomNumber = Math.floor(Math.random() * 10000)
    return `ORD-${randomNumber}`
}

router.post("/placeOrder", async (req, res) => {
    try {
        const {
            name,
            country,
            address,
            city,
            postCode,
            number,
            email,
            addInformation,
            orderAmount,
            cartProducts // New field in the request body to handle cart products
        } = req.body;

        const orderNumber = generatOrderNumber()
        // Create the order
        const placeOrder = await Order.create({
            name,
            country,
            address,
            city,
            postCode,
            number,
            email,
            addInformation,
            orderAmount,
            orderNumber,
            orderStatus: "Pending"
        });

        // Map over each product in the cartProducts array and create orderDetail documents
        const savedProducts = await Promise.all(cartProducts.map(async (product) => {
            const { productId, quantity, subTotal } = product;

            // Create the order detail using the current product's data
            return await orderDetail.create({
                orderId: placeOrder._id,
                subTotal,
                quantity,
                productId
            });
        }));

        res.json({ placeOrder, savedProducts }); // Return both order and saved products as response
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error occurred");
    }
});

router.get("/orderDetail/:orderId", async (req, res) => {
    try {
        const order = await orderDetail.find({ orderId: req.params.orderId })
            .populate("orderId", "name email address date orderNumber orderAmount orderStatus")
            .populate("productId", "title price subTotal")
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order)
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error occurred");
    }
})

module.exports = router;
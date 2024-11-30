// const { Orders } = require('../models/orders.js');
// const express = require('express');
// const router = express.Router();



// router.get(`/`, async (req, res) => {
//     try{
//         const page = parseInt(req.query.page) || 1;
//         const perPage = 8;
//         const totalPosts = await Orders.countDocuments();
//         const totalPages = Math.ceil(totalPosts / perPage);

//         if (page > totalPages){
//             return res.status(404).jsnon({message: "No data found!"})
//         }

//         const ordersList = await Orders.find()
//             .skip((page - 1) * perPage)
//             .limit(perPage)
//             .exec();

//         if (!ordersList){
//             res.status(500).json({ success: false })
//         }
        
//         return res.status(200).json({
//             "ordersList": ordersList,
//             "totalPages": totalPages,
//             "page": page
//         });
//     }catch (error){
//         res.status(500).json({ success: false })
//     }
// });

// router.get(`/all`, async (req, res) => {

//     try {
//         const orderList = await Orders.find(req.query);
//         if (!orderList) {
//             res.status(500).json({ success: false })
//         }
  
//         return res.status(200).json(orderList);
  
//     } catch (error) {
//         res.status(500).json({ success: false })
//     }
//   });


// router.get('/:id', async (req, res) => {

//     const order = await Orders.findById(req.params.id);

//     if (!order) {
//         res.status(500).json({ message: 'The order with the given ID was not found.' })
//     }
//     return res.status(200).send(order);
// })

// router.get(`/get/count`, async (req, res) =>{
//     const orderCount = await Orders.countDocuments()

//     if(!orderCount) {
//         res.status(500).json({success: false})
//     } 
//     res.send({
//         orderCount: orderCount
//     });
// })



// router.post('/create', async (req, res) => {

//     let order = new Orders({
//         name: req.body.name,
//         phoneNumber: req.body.phoneNumber,
//         address: req.body.address,
//         // pincode: req.body.pincode,
//         amount: req.body.amount,
//         paymentId: req.body.paymentId,
//         email: req.body.email,
//         userid: req.body.userid,
//         products: req.body.products,
//         status: req.body.status,
//     });



//     if (!order) {
//         res.status(500).json({
//             error: err,
//             success: false
//         })
//     }


//     order = await order.save();


//     res.status(201).json(order);

// });


// router.delete('/:id', async (req, res) => {

//     const deletedOrder = await Orders.findByIdAndDelete(req.params.id);

//     if (!deletedOrder) {
//         res.status(404).json({
//             message: 'Order not found!',
//             success: false
//         })
//     }

//     res.status(200).json({
//         success: true,
//         message: 'Order Deleted!'
//     })
// });


// router.put('/:id', async (req, res) => {

//     const order = await Orders.findByIdAndUpdate(
//         req.params.id,
//         {
//             name: req.body.name,
//             phoneNumber: req.body.phoneNumber,
//             address: req.body.address,
//             // pincode: req.body.pincode,
//             amount: req.body.amount,
//             paymentId: req.body.paymentId,
//             email: req.body.email,
//             userid: req.body.userid,
//             products: req.body.products,
//             status:req.body.status
//         },
//         { new: true }
//     )



//     if (!order) {
//         return res.status(500).json({
//             message: 'Order cannot be updated!',
//             success: false
//         })
//     }

//     res.send(order);

// })



// module.exports = router;

const { Orders } = require('../models/orders.js');
const express = require('express');
const router = express.Router();



router.get(`/`, async (req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const perPage = 8;
        const totalPosts = await Orders.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages){
            return res.status(404).jsnon({message: "No data found!"})
        }

        const ordersList = await Orders.find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!ordersList){
            res.status(500).json({ success: false })
        }
        
        return res.status(200).json({
            "ordersList": ordersList,
            "totalPages": totalPages,
            "page": page
        });
    }catch (error){
        res.status(500).json({ success: false })
    }
});

router.get(`/all`, async (req, res) => {

    try {
        const orderList = await Orders.find(req.query);
        if (!orderList) {
            res.status(500).json({ success: false })
        }
  
        return res.status(200).json(orderList);
  
    } catch (error) {
        res.status(500).json({ success: false })
    }
  });


// router.get('/:id', async (req, res) => {

//     const order = await Orders.findById(req.params.id);

//     if (!order) {
//         res.status(500).json({ message: 'The order with the given ID was not found.' })
//     }
//     return res.status(200).send(order);
// })

router.get('/:userid', async (req, res) => {
    const { userid } = req.params;

    try {
        // Tìm các đơn hàng dựa trên userid
        const userOrders = await Orders.find({ userid });

        if (!userOrders || userOrders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn hàng của người dùng.' 
            });
        }

        // Trả về danh sách đơn hàng của người dùng
        return res.status(200).json({
            success: true,
            orders: userOrders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error, please try again later.' 
        });
    }
});

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Orders.countDocuments()

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})



router.post('/create', async (req, res) => {

    let order = new Orders({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        // pincode: req.body.pincode,
        amount: req.body.amount,
        paymentId: req.body.paymentId,
        email: req.body.email,
        userid: req.body.userid,
        products: req.body.products,
        status: req.body.status,
    });



    if (!order) {
        res.status(500).json({
            error: err,
            success: false
        })
    }


    order = await order.save();


    res.status(201).json(order);

});


router.delete('/:id', async (req, res) => {

    const deletedOrder = await Orders.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
        res.status(404).json({
            message: 'Order not found!',
            success: false
        })
    }

    res.status(200).json({
        success: true,
        message: 'Order Deleted!'
    })
});


router.put('/:id', async (req, res) => {

    const order = await Orders.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            // pincode: req.body.pincode,
            amount: req.body.amount,
            paymentId: req.body.paymentId,
            email: req.body.email,
            userid: req.body.userid,
            products: req.body.products,
            status:req.body.status
        },
        { new: true }
    )



    if (!order) {
        return res.status(500).json({
            message: 'Order cannot be updated!',
            success: false
        })
    }

    res.send(order);

})



module.exports = router;
